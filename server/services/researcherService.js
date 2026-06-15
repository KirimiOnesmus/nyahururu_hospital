const crypto     = require("crypto");
const jwt        = require("jsonwebtoken");
const Researcher = require("../models/ResearcherModel");
const emailService = require("../utils/emailServices");
const { AppError } = require("../utils/appError");

const {
  RESEARCHER_ROLES,
  RESEARCHER_STATUSES,
} = require("../constants/researchIndex");

const signToken = (id, role) =>
  jwt.sign(
    { id, role, collection: "researchers" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );



  const register = async (data) => {
  const { firstName, lastName, email, password, institution, discipline, qualification, phone, bio } = data;

  const existing = await Researcher.findByEmail(email);
  if (existing) throw new AppError("An account with this email already exists.", 409);

  const researcher = new Researcher({
    firstName,
    lastName,
    email,
    password,
    institution:   institution   || "",
    discipline:    discipline    || "",
    qualification: qualification || "",
    phone:         phone         || "",
    bio:           bio           || "",
    role:          RESEARCHER_ROLES.RESEARCHER,
    status:        RESEARCHER_STATUSES.ACTIVE,
    emailVerified: false,
  });


  const rawToken   = researcher.generateToken("verification");
  await researcher.save();

  const verifyLink = `${process.env.FRONTEND_URL}/hmis?verify=true&token=${rawToken}&email=${encodeURIComponent(email)}`;

  await emailService.sendResearcherVerificationEmail({
    email: researcher.email,
    name:  researcher.firstName,
    verifyLink,
  });

  const token = signToken(researcher._id, researcher.role);

  return {
    token,
    researcher,
    ...(process.env.NODE_ENV !== "production" && { _devVerifyLink: verifyLink }),
  };
};


//  VERIFY EMAIL

const verifyEmail = async ({ token, email }) => {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const researcher = await Researcher.findOne({
    email:                   email.toLowerCase(),
    emailVerificationToken:  hashed,
    emailVerificationExpire: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationExpire");

  if (!researcher) {
    throw new AppError("Verification link is invalid or has expired.", 400);
  }

  researcher.emailVerified             = true;
  researcher.emailVerificationToken    = null;
  researcher.emailVerificationExpire   = null;
  await researcher.save();

  return researcher;
};
 
//  LOGIN

const login = async ({ email, password }) => {
  const researcher = await Researcher.findOne({
    email:  email.toLowerCase(),
    role:   { $in: Object.values(RESEARCHER_ROLES) },
    isActive: true,
  }).select("+password");

  
  const authError = new AppError("Invalid email or password.", 401);

  if (!researcher) throw authError;

  const isValid = await researcher.matchPassword(password);
  if (!isValid) throw authError;

  if (researcher.status === RESEARCHER_STATUSES.SUSPENDED) {
    throw new AppError("Your account has been suspended. Please contact support.", 403);
  }

 
  if (
    researcher.role === RESEARCHER_ROLES.RESEARCHER &&
    !researcher.emailVerified
  ) {
    throw new AppError(
      "Please verify your email before logging in. Check your inbox for the verification link.",
      403
    );
  }

  researcher.lastLogin = new Date();
  await researcher.save();

  const token = signToken(researcher._id, researcher.role);
  return { token, researcher };
};

const getMe = async (researcherId) => {
  const researcher = await Researcher.findById(researcherId);
  if (!researcher) throw new AppError("Researcher not found.", 404);
  return researcher;
};

const updateProfile = async (researcherId, updates) => {
  const ALLOWED = [
    "firstName", "lastName", "phone", "institution",
    "discipline", "qualification", "bio", "title", "location", "socialLinks",
  ];

  const safeUpdates = {};
  ALLOWED.forEach((f) => {
    if (updates[f] !== undefined) safeUpdates[f] = updates[f];
  });

  // Keep name in sync when names change
  if (safeUpdates.firstName || safeUpdates.lastName) {
    const current = await Researcher.findById(researcherId);
    safeUpdates.name = `${safeUpdates.firstName || current.firstName} ${
      safeUpdates.lastName || current.lastName
    }`.trim();
  }

  const researcher = await Researcher.findByIdAndUpdate(
    researcherId,
    { $set: safeUpdates },
    { new: true, runValidators: true }
  );
  if (!researcher) throw new AppError("Researcher not found.", 404);
  return researcher;
};

const changePassword = async (researcherId, { currentPassword, newPassword }) => {
  const researcher = await Researcher.findById(researcherId).select("+password");
  if (!researcher) throw new AppError("Researcher not found.", 404);

  const isValid = await researcher.matchPassword(currentPassword);
  if (!isValid) throw new AppError("Current password is incorrect.", 401);

  researcher.password = newPassword;
  await researcher.save();
};

const forgotPassword = async (email) => {
  const researcher = await Researcher.findByEmail(email);

  // Always return the same message — never reveal if email exists
  const safeMessage = "If that email is registered, a reset link has been sent.";

  if (!researcher) return safeMessage;

  const rawToken = researcher.generateToken("reset");
  await researcher.save();

  const resetLink = `${process.env.FRONTEND_URL}/research/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  await emailService.sendPasswordResetEmail({
    email: researcher.email,
    name:  researcher.firstName,
    resetLink,
  });

  return safeMessage;
};

const resetPassword = async ({ token, email, password }) => {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const researcher = await Researcher.findOne({
    email:               email.toLowerCase(),
    passwordResetToken:  hashed,
    passwordResetExpire: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpire");

  if (!researcher) {
    throw new AppError("Password reset token is invalid or has expired.", 400);
  }

  researcher.password            = password;
  researcher.passwordResetToken  = null;
  researcher.passwordResetExpire = null;
  await researcher.save();
};


//  ADMIN CREATE RESEARCHER


const generateRandomPassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!";
  return Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};

const adminCreateResearcher = async (data) => {
  const { firstName, lastName, email, phone } = data;

  const existing = await Researcher.findByEmail(email);
  if (existing) throw new AppError("An account with this email already exists.", 409);

  const rawPassword = generateRandomPassword();

  const researcher = await Researcher.create({
    firstName,
    lastName,
    email:         email.toLowerCase(),
    password:      rawPassword,
    phone:         phone || "",
    role:          RESEARCHER_ROLES.RESEARCHER,
    status:        RESEARCHER_STATUSES.ACTIVE,
    emailVerified: true, 
  });

  await emailService.sendAdminAddedResearcher({
    email: researcher.email,
    name:  researcher.firstName,
    password: rawPassword,
  });

  return researcher;
};

module.exports = {
  register,
  verifyEmail,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  adminCreateResearcher,
  signToken,
};