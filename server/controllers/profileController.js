const User = require("../models/userModel");
const Profile = require("../models/ProfileModel");
const Doctor = require("../models/doctorModel");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
  sendVerificationEmail,
  sendPasswordChangedEmail,
} = require("../utils/emailServices");

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "-password -emailVerificationToken -emailVerificationExpire -passwordResetToken -passwordResetExpire",
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    let doctorDetails = null;
    if (user.role === "doctor")
      doctorDetails = await Doctor.findOne({ userId });

    const profile = await Profile.findOne({ userId });

    res.status(200).json({
      success: true,
      data: {
        user,
        doctorDetails,
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const FORBIDDEN = [
      "password",
      "role",
      "employeeId",
      "rfidTag",
      "rfid",
      "emailVerified",
      "emailVerificationToken",
      "emailVerificationExpire",
      "passwordResetToken",
      "passwordResetExpire",
    ];

    FORBIDDEN.forEach((field) => delete req.body[field]);

    const {
      name,
      email,
      phone,
      address,
      bio,
      speciality,
      education,
      profileImage,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let emailUpdated = false;

    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const emailVerificationToken = crypto.randomBytes(32).toString("hex");
      const emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

      user.email = email.toLowerCase();
      user.emailVerified = false;
      user.emailVerificationToken = crypto
        .createHash("sha256")
        .update(emailVerificationToken)
        .digest("hex");
      user.emailVerificationExpire = emailVerificationExpire;
      emailUpdated = true;

      try {
        await sendVerificationEmail(user.email, emailVerificationToken, userId);
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
      }
    }

    if (name?.trim()) user.name = name.trim();
    await user.save();

    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({
        userId,
        phone,
        address,
        imageUrl: profileImage || null,
      });
    } else {
      if (phone !== undefined) profile.phone = phone;
      if (address !== undefined) profile.address = address;
      if (profileImage !== undefined) profile.imageUrl = profileImage;
      profile.updatedAt = Date.now();
    }
    await profile.save();

    // Update doctor details if applicable
    let doctorDetails = null;
    if (user.role === "doctor") {
      let doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        doctor = new Doctor({
          userId,
          speciality: speciality || "",
          bio: bio || "",
          education: education || "",
        });
      } else {
        if (speciality !== undefined) doctor.speciality = speciality;
        if (bio !== undefined) doctor.bio = bio;
        if (education !== undefined) doctor.education = education;
        doctor.updatedAt = Date.now();
      }
      await doctor.save();
      doctorDetails = doctor;
    }

    const updatedUser = await User.findById(userId).select(
      "-password -emailVerificationToken -emailVerificationExpire -passwordResetToken -passwordResetExpire",
    );
    profile = await Profile.findOne({ userId });

    const message = emailUpdated
      ? "Profile updated successfully! Please verify your new email address."
      : "Profile updated successfully!";

    res.status(200).json({
      success: true,
      message,
      data: {
        user: updatedUser,
        doctorDetails,
        profile,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword, currentPassword } = req.body;

    const currentPass = oldPassword || currentPassword;

    if (!currentPass || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide both current and new password",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain uppercase, lowercase, number, and special character",
      });
    }

    if (newPassword === currentPass) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "No password set on this account. Use password reset instead.",
      });
    }

    const isMatch = await bcrypt.compare(currentPass, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    try {
      await sendPasswordChangedEmail(user.email, user.name);
    } catch (emailErr) {
      console.error(
        "[Profile] Password change email failed:",
        emailErr.message,
      );
    }

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
};

exports.uploadProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Validate file type
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res
        .status(400)
        .json({ message: "Only JPEG, PNG, and WebP images are allowed" });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res
        .status(400)
        .json({ message: "File size must be less than 5MB" });
    }

    const imageUrl = `/uploads/profile/${req.file.filename}`;

    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId, imageUrl });
    } else {
      profile.imageUrl = imageUrl;
      profile.updatedAt = Date.now();
    }
    await profile.save();

    res.status(200).json({ success: true, imageUrl });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to upload image", error: err.message });
  }
};
