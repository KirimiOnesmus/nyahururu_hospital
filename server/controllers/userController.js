const UserData = require("../models/userModel");
const Doctor = require("../models/doctorModel");
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
const MINIMAL_PROJECTION =
  "firstName lastName name email role department position profileImage photo";
const FULL_PROJECTION =
  "-password -emailVerificationToken -emailVerificationExpire -passwordResetToken -passwordResetExpire";


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
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    UserData.find().select(FULL_PROJECTION).skip(skip).limit(limit).sort({ createdAt: -1 }),
    UserData.countDocuments(),
  ]);

  return sendSuccess(res, 200, "Users fetched", users, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasNext: skip + users.length < total,
    hasPrev: page > 1,
  });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const callerRole = req.user?.role;
  const projection = FULL_ADMIN_ROLES.includes(callerRole) ? FULL_PROJECTION : MINIMAL_PROJECTION;

  const user = await UserData.findById(req.params.id).select(projection);
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

  const existingEmail = await UserData.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    throw new AppError("Email already in use", 400);
  }

  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  const emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;


  const temporaryPassword = password || exports.generateNewPassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, BCRYPT_SALT_ROUNDS);

  const employeeId = await generateEmployeeId(role || "STAFF", UserData);
  const rfidTag = generateRFID(employeeId);

  const user = await UserData.create({
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role.toLowerCase(),
    department,
    specialization,
    position,
    phone,
    dateOfBirth,
    joinDate,
    profileImage: profileImage || photo,
    signature,
    employeeId,
    rfidTag,
    rfid: rfidTag,
    bloodGroup,
    expiryDate,
    signatureText,
    terms,
    photo: photo || profileImage,
    emailVerified: false,
    mustChangePassword: true,
    emailVerificationToken: crypto.createHash("sha256").update(emailVerificationToken).digest("hex"),
    emailVerificationExpire,
  });

  try {
    await sendVerificationEmail(user.email, emailVerificationToken, user._id);
  } catch (emailErr) {
    req.log?.warn?.({ err: emailErr }, "Verification email failed to send");
  }

  if (role.toLowerCase() === "doctor" && department) {
    await exports.syncDoctorProfile(user._id, { role: "doctor", department });
  }

  return sendSuccess(res, 201, "User registered successfully. Please verify your email to activate your account.", {
    user: {
      ...user.toObject(),
      password: undefined,
      emailVerificationToken: undefined,
      emailVerificationExpire: undefined,
      _id: user._id,
    },
 
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
    _id: userId,
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  const newPassword = exports.generateNewPassword();
  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  user.emailVerified = true;
  user.password = hashedPassword;
  user.mustChangePassword = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  try {
    await sendNewPasswordEmail(user.email, newPassword, user._id);
  } catch (emailErr) {
    req.log?.warn?.({ err: emailErr }, "New-password email failed to send");
  }

  return sendSuccess(res, 200, "Email verified successfully. A new password has been sent to your email.");
});

exports.updateUser = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  const userId = req.params.id;
  const callerRole = req.user?.role;
  const callerId = req.user?._id?.toString();


  delete updates.employeeId;
  delete updates.rfidTag;
  delete updates.rfid;
  delete updates.emailVerified;
  delete updates.emailVerificationToken;
  delete updates.emailVerificationExpire;
  delete updates.passwordResetToken;
  delete updates.passwordResetExpire;
  delete updates.failedLoginAttempts;
  delete updates.lockUntil;

  const currentUser = await UserData.findById(userId);
  if (!currentUser) {
    throw new AppError("User not found", 404);
  }


  if (updates.role) {
    if (userId === callerId) {
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

    const existingEmail = await UserData.findOne({ email: updates.email.toLowerCase() });
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
    updates.password = await bcrypt.hash(updates.password, BCRYPT_SALT_ROUNDS);
    updates.mustChangePassword = false;
  }

  if (updates.photo && !updates.profileImage) {
    updates.profileImage = updates.photo;
  }

  const user = await UserData.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select(FULL_PROJECTION);

  if (newRole === "doctor" && (updates.department || currentUser.department)) {
    await exports.syncDoctorProfile(userId, { role: "doctor", department: newDepartment });
  }

  return sendSuccess(res, 200, "User updated successfully", { user });
});

exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await UserData.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    return sendSuccess(res, 200, "If that email exists, a password reset link has been sent.");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpire = Date.now() + 60 * 60 * 1000;
  await user.save();

  const resetLink = `${process.env.FRONTEND_URL || ""}reset-password?token=${resetToken}&userId=${user._id}`;

  try {
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name || user.firstName || "User",
      resetLink,
    });
  } catch (emailErr) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
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
    _id: userId,
    passwordResetToken,
    passwordResetExpire: { $gt: Date.now() },
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

  user.password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  user.mustChangePassword = false;
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  return sendSuccess(res, 200, "Password reset successfully");
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const callerRole = req.user?.role;
  const callerId = req.user?._id?.toString();

  if (userId === callerId) {
    throw new AppError("You cannot delete your own account.", 403);
  }

  const target = await UserData.findById(userId);
  if (!target) {
    throw new AppError("User not found", 404);
  }


  if (!canAssignRole(callerRole, target.role)) {
    throw new AppError("You cannot delete a user with a higher-privileged role.", 403);
  }

  if (target.role === "superadmin") {
    const otherSuperadmins = await UserData.countDocuments({
      role: "superadmin",
      isActive: { $ne: false },
      _id: { $ne: target._id },
    });
    if (otherSuperadmins === 0) {
      throw new AppError("Cannot delete the last remaining superadmin account.", 403);
    }
  }

  await UserData.findByIdAndDelete(userId);
  return sendSuccess(res, 200, "User deleted successfully");
});

exports.syncDoctorProfile = async (userId, userData) => {
  if (!(userData.role && userData.role.toLowerCase() === "doctor")) return null;

  const { department } = userData;
  if (!department) return null;

  let doctor = await Doctor.findOne({ userId });
  if (!doctor) {
    doctor = new Doctor({ userId, department });
  } else {
    doctor.department = department;
    doctor.updatedAt = Date.now();
  }
  await doctor.save();
  return doctor;
};