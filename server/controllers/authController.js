const { User, TokenBlacklist } = require("../sequelize/models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { AppError, asyncHandler, sendSuccess } = require("../utils/appError");
const audit = require("../services/auditService");
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


exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const user = await User.findOne({ where: { email: email.toLowerCase() } });

  const genericError = () => new AppError("Invalid email or password.", 401);

  if (!user) {
    await bcrypt.compare(password, "$2a$12$invalidsaltinvalidsaltinvalidsal");
    audit.log({
      req,
      action: "login_failed",
      resource: "User",
      description: "Authentication failed — unknown email",
      severity: "high",
      actor: { userId: null, userName: null, userEmail: email, userRole: null },
    });
    throw genericError();
  }


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
    const locked = user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
    if (locked) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    audit.log({
      req,
      action: "login_failed",
      resource: "User",
      resourceId: user.id,
      description: locked
        ? `Account locked after repeated failures — ${user.email}`
        : `Invalid password — ${user.email}`,
      severity: locked ? "critical" : "high",
      actor: { userId: user.id, userName: user.name, userEmail: user.email, userRole: user.role },
    });
    throw genericError();
  }


  if (!user.emailVerified) {
    throw new AppError(
      "Please verify your email before logging in. Check your inbox for the verification link.",
      403
    );
  }

  if (user.isActive === false) {
    throw new AppError("Your account has been deactivated. Contact an administrator.", 403);
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  const { token: accessToken } = signAccessToken(user);
  const { token: refreshToken } = signRefreshToken(user);


  setAuthCookies(res, accessToken, refreshToken);

  audit.log({
    req,
    action: "login",
    resource: "User",
    resourceId: user.id,
    description: `${user.name || user.email} logged in`,
    severity: "info",
  });

return sendSuccess(res, 200, "Login successful", {
  mustChangePassword: !!user.mustChangePassword,
  user: {
    id: user.id,
    name: user.name,
    role: user.role,
  },
});
});


exports.me = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "OK", {
    user: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role,
    },
    mustChangePassword: !!req.user.mustChangePassword,
  });
});


exports.logout = asyncHandler(async (req, res) => {
  const decoded = req.decodedToken; 
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

  audit.log({
    req,
    action: "logout",
    resource: "User",
    description: "User session ended",
    severity: "info",
  });

  return sendSuccess(res, 200, "Logged out successfully");
});


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


  await TokenBlacklist.upsert({
    jti: decoded.jti,
    expiresAt: new Date(decoded.exp * 1000),
  });

  const { token: accessToken } = signAccessToken(user);
  const { token: newRefreshToken } = signRefreshToken(user);
  setAuthCookies(res, accessToken, newRefreshToken);

  return sendSuccess(res, 200, "Token refreshed", { token: accessToken });
});
