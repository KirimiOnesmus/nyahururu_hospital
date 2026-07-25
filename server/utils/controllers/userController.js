const { Op } = require("sequelize");
const { User: UserData, Doctor } = require("../sequelize/models");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { generateEmployeeId, generateRFID } = require("../utils/generateIds");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNewPasswordEmail,
} = require("../utils/emailServices");
const { AppError, asyncHandler, sendSuccess } = require("../utils/appError");
const { BCRYPT_SALT_ROUNDS } = require("../constants/authConfig");
const { canAssignRole } = require("../utils/roleCeiling");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

const FULL_ADMIN_ROLES = ["admin", "it", "superadmin"];

// CUTOVER NOTE: Mongoose used a projection *string* ("-password ...").
// Sequelize's equivalent is an `attributes: { exclude: [...] }` clause.
// Unlike the Sequelize User model's defaultScope (which only hides the
// four token columns), `password` is NOT hidden by default — so every
// query that returns a user to the client must explicitly exclude it,
// same as the original Mongoose controller did with FULL_PROJECTION.
const MINIMAL_ATTRIBUTES = [
  "id",
  "firstName",
  "lastName",
  "name",
  "email",
  "role",
  "department",
  "position",
  "photo",
];
const FULL_EXCLUDE = [
  "password",
  "emailVerificationToken",
  "emailVerificationExpire",
  "passwordResetToken",
  "passwordResetExpire",
];

exports.generateNewPassword = () => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "@$!%*?&";

  const allChars = uppercase + lowercase + numbers + special;
  let password = "";

  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));

  for (let i = password.length; i < 12; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const { rows: users, count: total } = await UserData.findAndCountAll({
    attributes: { exclude: FULL_EXCLUDE },
    offset,
    limit,
    order: [["createdAt", "DESC"]],
  });

  return sendSuccess(res, 200, "Users fetched", users, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasNext: offset + users.length < total,
    hasPrev: page > 1,
  });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const callerRole = req.user?.role;
  const attributes = FULL_ADMIN_ROLES.includes(callerRole)
    ? { exclude: FULL_EXCLUDE }
    : MINIMAL_ATTRIBUTES;

  const user = await UserData.findByPk(req.params.id, { attributes });
  if (!user) throw new AppError("User not found", 404);

  return sendSuccess(res, 200, "User fetched", user);
});

exports.createUser = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    department,
    specialization,
    position,
    phone,
    dateOfBirth,
    joinDate,
    profileImage,
    signature,
    bloodGroup,
    expiryDate,
    signatureText,
    terms,
    photo,
  } = req.body;

  if (!firstName || !lastName || !email || !role) {
    throw new AppError(
      "Missing required fields: firstName, lastName, email, and role are required",
      400
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new AppError("Invalid email format", 400);
  }

  if (!canAssignRole(req.user?.role, role)) {
    throw new AppError(
      `Your role ('${req.user?.role}') is not permitted to assign the '${role}' role.`,
      403
    );
  }

  if (password) {
    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters long", 400);
    }
    if (!PASSWORD_REGEX.test(password)) {
      throw new AppError(
        "Password must contain uppercase, lowercase, number, and special character",
        400
      );
    }
  }

  if (role.toLowerCase() === "doctor" && !department) {
    throw new AppError("Department is required for doctors", 400);
  }

  const existingEmail = await UserData.findOne({ where: { email: email.toLowerCase() } });
  if (existingEmail) {
    throw new AppError("Email already in use", 400);
  }

  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  const emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  const temporaryPassword = password || exports.generateNewPassword();

  const employeeId = await generateEmployeeId(role || "STAFF", UserData);
  const rfidTag = generateRFID(employeeId);

  // CUTOVER NOTE: no manual bcrypt.hash() call here. The Sequelize User
  // model's `beforeSave` hook hashes `password` automatically whenever it
  // changes (see sequelize/models/user.js) — hashing it here too would
  // double-hash it and make the temp password unusable. Same reasoning
  // applies everywhere else a `password` field is written in this file.
  const user = await UserData.create({
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    email: email.toLowerCase(),
    password: temporaryPassword,
    role: role.toLowerCase(),
    department,
    position,
    phone,
    dateOfBirth,
    joinDate,
    photo: photo || profileImage,
    signature,
    employeeId,
    rfidTag,
    bloodGroup,
    expiryDate,
    signatureText,
    terms,
    emailVerified: false,
    mustChangePassword: true,
    emailVerificationToken: crypto.createHash("sha256").update(emailVerificationToken).digest("hex"),
    emailVerificationExpire,
  });
  // `specialization` and a duplicate `rfid` alias existed on the Mongoose
  // write but were never declared columns on the Sequelize model (or the
  // migration) — dropped as dead writes rather than silently carried
  // forward. If the frontend actually depends on either, flag it and
  // we'll add real columns via a migration, same as mustChangePassword
  // and isActive above.

  try {
    await sendVerificationEmail(user.email, emailVerificationToken, user.id);
  } catch (emailErr) {
    req.log?.warn?.({ err: emailErr }, "Verification email failed to send");
  }

  if (role.toLowerCase() === "doctor" && department) {
    // KNOWN GAP, see top-of-file note: Doctor.userId is still a Mongoose
    // ObjectId field, but user.id is now a Sequelize integer. This WILL
    // throw a Mongoose CastError until Doctor gets its own cutover
    // (Step 2, Content domain). Caught here — non-fatal, matches the
    // existing pattern for email-send failures — so the already-created
    // User account doesn't 500 out from under the caller. Doctor accounts
    // created during this window won't have a synced Doctor profile until
    // that's resolved; track it, don't silently leave it broken.
    try {
      await exports.syncDoctorProfile(user.id, { role: "doctor", department });
    } catch (doctorErr) {
      // Defensive: the user record is already committed, so we log and
      // continue rather than fail the whole request. Admin can inspect
      // and re-run the sync if this fires.
      req.log?.error?.(
        { err: doctorErr, userId: user.id },
        "syncDoctorProfile failed after user create",
      );
    }
  }

  const safeUser = user.toJSON();
  delete safeUser.password;
  delete safeUser.emailVerificationToken;
  delete safeUser.emailVerificationExpire;

  return sendSuccess(res, 201, "User registered successfully. Please verify your email to activate your account.", {
    user: safeUser,
    temporaryPassword,
  });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token, userId } = req.body;

  if (!token || !userId) {
    throw new AppError("Token and user ID are required", 400);
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await UserData.findOne({
    where: {
      id: userId,
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { [Op.gt]: Date.now() },
    },
  });

  if (!user) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  const newPassword = exports.generateNewPassword();

  user.emailVerified = true;
  user.password = newPassword; // hashed by the model hook on save()
  user.mustChangePassword = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpire = null;
  await user.save();

  try {
    await sendNewPasswordEmail(user.email, newPassword, user.id);
  } catch (emailErr) {
    req.log?.warn?.({ err: emailErr }, "New-password email failed to send");
  }

  return sendSuccess(res, 200, "Email verified successfully. A new password has been sent to your email.");
});

exports.updateUser = asyncHandler(async (req, res) => {
  // L-5: explicit allow-list instead of a deny-list. A deny-list has to
  // be remembered and updated every time a new sensitive column is added
  // to the User model; this is safe-by-default against anything new,
  // matching the pattern profileController.updateProfile already uses
  // correctly elsewhere in this codebase. `name` is deliberately excluded
  // — it's always derived from firstName/lastName below, never taken
  // directly from client input.
  const ALLOWED_FIELDS = [
    "firstName", "lastName", "email", "role", "department", "position",
    "phone", "bloodGroup", "expiryDate", "signatureText", "dateOfBirth",
    "joinDate", "photo", "terms", "signature", "password", "isActive",
  ];
  const updates = {};
  for (const field of ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  const userId = req.params.id;
  const callerRole = req.user?.role;
  const callerId = req.user?.id?.toString();

  const currentUser = await UserData.findByPk(userId);
  if (!currentUser) {
    throw new AppError("User not found", 404);
  }

  if (updates.role) {
    if (String(userId) === callerId) {
      throw new AppError("You cannot change your own role.", 403);
    }
    if (!canAssignRole(callerRole, updates.role)) {
      throw new AppError(
        `Your role ('${callerRole}') is not permitted to assign the '${updates.role}' role.`,
        403
      );
    }

    if (!canAssignRole(callerRole, currentUser.role)) {
      throw new AppError("You cannot modify a user with a higher-privileged role.", 403);
    }
  }

  if (updates.email && updates.email !== currentUser.email) {
    if (!EMAIL_REGEX.test(updates.email)) {
      throw new AppError("Invalid email format", 400);
    }

    const existingEmail = await UserData.findOne({ where: { email: updates.email.toLowerCase() } });
    if (existingEmail) {
      throw new AppError("Email already in use", 400);
    }

    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

    updates.email = updates.email.toLowerCase();
    updates.emailVerified = false;
    updates.emailVerificationToken = crypto.createHash("sha256").update(emailVerificationToken).digest("hex");
    updates.emailVerificationExpire = emailVerificationExpire;

    try {
      await sendVerificationEmail(updates.email, emailVerificationToken, userId);
    } catch (emailErr) {
      req.log?.warn?.({ err: emailErr }, "Verification email failed to send");
    }
  }

  const newRole = updates.role?.toLowerCase() || currentUser.role;
  const newDepartment = updates.department || currentUser.department;

  if (newRole === "doctor" && !newDepartment && !updates.department) {
    throw new AppError("Department is required for doctors", 400);
  }

  if (updates.firstName || updates.lastName) {
    const firstName = updates.firstName || currentUser.firstName || "";
    const lastName = updates.lastName || currentUser.lastName || "";
    updates.name = `${firstName} ${lastName}`.trim();
  }

  if (updates.password) {
    if (updates.password.length < 8) {
      throw new AppError("Password must be at least 8 characters long", 400);
    }
    if (!PASSWORD_REGEX.test(updates.password)) {
      throw new AppError(
        "Password must contain uppercase, lowercase, number, and special character",
        400
      );
    }
    // Left raw — the model hook hashes it on save(). Do NOT bcrypt.hash
    // here, that would double-hash (see the note in createUser above).
    updates.mustChangePassword = false;
  }

  if (updates.photo && !updates.profileImage) {
    updates.profileImage = updates.photo;
  }
  delete updates.profileImage; // not a real column — `photo` is the field

  currentUser.set(updates);
  await currentUser.save();

  if (newRole === "doctor" && (updates.department || currentUser.department)) {
    // Non-fatal by design: the user update is already committed, so a
    // failed doctor sync just gets logged.
    try {
      await exports.syncDoctorProfile(userId, { role: "doctor", department: newDepartment });
    } catch (doctorErr) {
      req.log?.error?.(
        { err: doctorErr, userId },
        "syncDoctorProfile failed after user update",
      );
    }
  }

  const user = await UserData.findByPk(userId, { attributes: { exclude: FULL_EXCLUDE } });

  return sendSuccess(res, 200, "User updated successfully", { user });
});

exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await UserData.findOne({ where: { email: email.toLowerCase() } });

  if (!user) {
    return sendSuccess(res, 200, "If that email exists, a password reset link has been sent.");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpire = Date.now() + 60 * 60 * 1000;
  await user.save();

  const resetLink = `${process.env.FRONTEND_URL || ""}reset-password?token=${resetToken}&userId=${user.id}`;

  try {
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name || user.firstName || "User",
      resetLink,
    });
  } catch (emailErr) {
    user.passwordResetToken = null;
    user.passwordResetExpire = null;
    await user.save();
    req.log?.error?.({ err: emailErr }, "Password reset email failed to send");
    throw new AppError("Error sending reset email", 500);
  }

  return sendSuccess(res, 200, "If that email exists, a password reset link has been sent.");
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, userId, newPassword } = req.body;

  if (!token || !userId || !newPassword) {
    throw new AppError("Token, user ID, and new password are required", 400);
  }

  const passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await UserData.findOne({
    where: {
      id: userId,
      passwordResetToken,
      passwordResetExpire: { [Op.gt]: Date.now() },
    },
  });

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  if (!PASSWORD_REGEX.test(newPassword) || newPassword.length < 8) {
    throw new AppError(
      "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character",
      400
    );
  }

  user.password = newPassword; // hashed by the model hook on save()
  user.passwordResetToken = null;
  user.passwordResetExpire = null;
  user.mustChangePassword = false;
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  return sendSuccess(res, 200, "Password reset successfully");
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const callerRole = req.user?.role;
  const callerId = req.user?.id?.toString();

  if (String(userId) === callerId) {
    throw new AppError("You cannot delete your own account.", 403);
  }

  const target = await UserData.findByPk(userId);
  if (!target) {
    throw new AppError("User not found", 404);
  }

  if (!canAssignRole(callerRole, target.role)) {
    throw new AppError("You cannot delete a user with a higher-privileged role.", 403);
  }

  if (target.role === "superadmin") {
    const otherSuperadmins = await UserData.count({
      where: {
        role: "superadmin",
        isActive: { [Op.ne]: false },
        id: { [Op.ne]: target.id },
      },
    });
    if (otherSuperadmins === 0) {
      throw new AppError("Cannot delete the last remaining superadmin account.", 403);
    }
  }

  await target.destroy();
  return sendSuccess(res, 200, "User deleted successfully");
});

// syncDoctorProfile: keep a matching Doctor row in step with a User
// whose role is "doctor". Now Sequelize on both sides — the
// Content-domain cutover landed Doctor. findOrCreate runs the whole
// SELECT-then-INSERT-or-UPDATE inside a single MySQL transaction so
// two concurrent user-updates can't both create a duplicate Doctor row
// for the same user.
exports.syncDoctorProfile = async (userId, userData) => {
  if (!(userData.role && userData.role.toLowerCase() === "doctor")) return null;

  const { department } = userData;
  if (!department) return null;

  const [doctor, created] = await Doctor.findOrCreate({
    where: { userId },
    defaults: { userId, department, availability: [] },
  });
  if (!created && doctor.department !== department) {
    doctor.department = department;
    await doctor.save();
  }
  return doctor;
};
