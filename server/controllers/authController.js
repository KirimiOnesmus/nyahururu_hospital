const { User, TokenBlacklist } = require("../sequelize/models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { AppError, asyncHandler, sendSuccess } = require("../utils/appError");
const {
  MAX_FAILED_LOGIN_ATTEMPTS,
  LOCK_DURATION_MS,
} = require("../constants/authConfig");
const {
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} = require("../utils/tokenService");

// C2: authController.register used to be a second, much weaker path to
// create staff accounts (no role ceiling, no email verification, weaker
// hashing). It has been removed entirely — POST /api/auth/register now
// routes straight to the hardened userController.createUser (see
// routes/authRoutes.js), so there is exactly one code path for account
// creation.

// C3 fix: the old `console.log(req.body)` here logged plaintext passwords
// to stdout. Deleted — never log req.body on an auth route.
//
// CUTOVER NOTE (Mongo -> MySQL, auth domain): `User` and `TokenBlacklist`
// are now the Sequelize models from sequelize/models. Query shapes changed
// (`findOne({email})` -> `findOne({ where: { email } })`, `_id` -> `id`),
// but the auth logic itself — lockouts, email-verification gate, response
// shape — is unchanged.
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const user = await User.findOne({ where: { email: email.toLowerCase() } });

  // H2: identical response for "no such user" and "wrong password" so the
  // client can't distinguish account existence. Also run a dummy bcrypt
  // compare when the user doesn't exist so both branches take a similar
  // amount of time (mitigates timing-based enumeration).
  const genericError = () => new AppError("Invalid email or password.", 401);

  if (!user) {
    await bcrypt.compare(password, "$2a$12$invalidsaltinvalidsaltinvalidsal");
    throw genericError();
  }

  // H3: per-account lockout after repeated failed attempts.
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new AppError(
      `Too many failed login attempts. Try again in ${minutesLeft} minute(s).`,
      423
    );
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw genericError();
  }

  // C1: login now requires a verified email, closing the window where a
  // newly-created account (system-generated temp password, see
  // userController.createUser) could be logged into by anyone who guessed
  // the old hardcoded default before the real owner ever verified.
  if (!user.emailVerified) {
    throw new AppError(
      "Please verify your email before logging in. Check your inbox for the verification link.",
      403
    );
  }

  if (user.isActive === false) {
    throw new AppError("Your account has been deactivated. Contact an administrator.", 403);
  }

  // Successful login: reset lockout counters.
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  const { token: accessToken } = signAccessToken(user);
  const { token: refreshToken } = signRefreshToken(user);

  // Issue both a bearer token (for the existing frontend Authorization
  // header flow) and httpOnly cookies (so the frontend can migrate off
  // localStorage — see the frontend security review, FC1).
  setAuthCookies(res, accessToken, refreshToken);

  return sendSuccess(res, 200, "Login successful", {
    token: accessToken,
    mustChangePassword: !!user.mustChangePassword,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
  });
});

// H5: staff previously had no way to revoke a token before its natural
// expiry. This blacklists the current access token's jti (and, if sent,
// the refresh token's jti) so it's rejected by verifyToken even though it
// hasn't technically expired yet.
//
// CUTOVER NOTE: Mongoose's `updateOne({ jti }, { ... }, { upsert: true })`
// becomes Sequelize's `upsert()`, which inserts-or-updates on the unique
// `jti` column in one call.
exports.logout = asyncHandler(async (req, res) => {
  const decoded = req.decodedToken; // set by verifyToken
  if (decoded?.jti && decoded?.exp) {
    await TokenBlacklist.upsert({
      jti: decoded.jti,
      expiresAt: new Date(decoded.exp * 1000),
    });
  }

  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    try {
      const refreshDecoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      if (refreshDecoded?.jti && refreshDecoded?.exp) {
        await TokenBlacklist.upsert({
          jti: refreshDecoded.jti,
          expiresAt: new Date(refreshDecoded.exp * 1000),
        });
      }
    } catch {
      // Refresh token already invalid/expired — nothing to blacklist.
    }
  }

  clearAuthCookies(res);
  return sendSuccess(res, 200, "Logged out successfully");
});

// H5: refresh-token rotation. Issues a new access token (and a new
// refresh token, invalidating the old one) from a valid, non-blacklisted
// refresh token.
exports.refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) throw new AppError("No refresh token provided.", 401);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError("Invalid or expired refresh token. Please log in again.", 401);
  }

  if (decoded.type !== "refresh") {
    throw new AppError("Invalid token type.", 401);
  }

  const blacklisted = await TokenBlacklist.findOne({ where: { jti: decoded.jti } });
  if (blacklisted) throw new AppError("This session has been revoked. Please log in again.", 401);

  const user = await User.findByPk(decoded.id);
  if (!user || user.isActive === false) {
    throw new AppError("Account not found or deactivated.", 401);
  }

  // Rotate: blacklist the used refresh token, issue a fresh pair.
  await TokenBlacklist.upsert({
    jti: decoded.jti,
    expiresAt: new Date(decoded.exp * 1000),
  });

  const { token: accessToken } = signAccessToken(user);
  const { token: newRefreshToken } = signRefreshToken(user);
  setAuthCookies(res, accessToken, newRefreshToken);

  return sendSuccess(res, 200, "Token refreshed", { token: accessToken });
});
