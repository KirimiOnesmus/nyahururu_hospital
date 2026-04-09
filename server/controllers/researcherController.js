const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Researcher = require("../models/ResearcherModel");
const researchEmail = require("../utils/emailServices");

/**
 * Sign a JWT token for researcher
 */
const signToken = (id, role) =>
  jwt.sign(
    { id, role, collection: "researchers" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

/**
 * Sanitize researcher object (remove sensitive fields)
 */
const sanitize = (doc) => {
  const obj = doc.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpire;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpire;
  return obj;
};

/**
 * ═══════════════════════════════════════════════════════════════
 * RESEARCHER SELF-REGISTRATION
 * POST /api/research/researchers/register
 * ═══════════════════════════════════════════════════════════════
 */
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      institution,
      discipline,
      qualification,
      phone,
      bio,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "firstName, lastName, email, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // Check if email already exists
    const existing = await Researcher.findOne({
      email: email.toLowerCase(),
    });
    if (existing) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    // Generate email verification token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create researcher account
    const researcher = await Researcher.create({
      firstName,
      lastName,
      email,
      password,
      institution: institution || "",
      discipline: discipline || "",
      qualification: qualification || "",
      phone: phone || "",
      bio: bio || "",
      role: "researcher",
      status: "active",
      emailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpire: expiry,
    });

    // Generate JWT token
    const jwtToken = signToken(researcher._id, researcher.role);

    // Send verification email
    const verifyLink = `${process.env.FRONTEND_URL}/research/verify-email?token=${rawToken}&email=${encodeURIComponent(
      email
    )}`;
    await researchEmail
      .sendResearcherVerificationEmail({
        email: researcher.email,
        name: researcher.firstName,
        verifyLink,
      })
      .catch((err) =>
        console.error("[Email] sendResearcherVerificationEmail:", err.message)
      );

    res.status(201).json({
      message:
        "Account created successfully. Please check your email to verify.",
      token: jwtToken,
      researcher: sanitize(researcher),
      _devVerifyLink: process.env.NODE_ENV !== "production" ? verifyLink : undefined,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message || "Registration failed" });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * VERIFY EMAIL ADDRESS
 * POST /api/research/researchers/verify-email
 * ═══════════════════════════════════════════════════════════════
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        message: "Token and email are required",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const researcher = await Researcher.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpire");

    if (!researcher) {
      return res.status(400).json({
        message: "Verification link is invalid or has expired",
      });
    }

    researcher.emailVerified = true;
    researcher.emailVerificationToken = null;
    researcher.emailVerificationExpire = null;
    await researcher.save();

    res.json({
      message: "Email verified successfully",
      researcher: sanitize(researcher),
    });
  } catch (err) {
    console.error("verifyEmail error:", err);
    res.status(500).json({ message: err.message || "Verification failed" });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * LOGIN
 * POST /api/research/researchers/login
 * ═══════════════════════════════════════════════════════════════
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find researcher and select password
    const researcher = await Researcher.findOne({
      email: email.toLowerCase(),
      role: { $in: ["researcher", "reviewer", "admin"] },
    }).select("+password");

    if (!researcher) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isPasswordValid = await researcher.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check if email is verified (for researchers)
    if (researcher.role === "researcher" && !researcher.emailVerified) {
      return res.status(403).json({
        message:
          "Please verify your email first. Check your inbox for the verification link.",
      });
    }

    // Update last login
    researcher.lastLogin = new Date();
    await researcher.save();

    const token = signToken(researcher._id, researcher.role);

    res.json({
      message: "Login successful",
      token,
      researcher: sanitize(researcher),
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: err.message || "Login failed" });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * GET CURRENT RESEARCHER PROFILE
 * GET /api/research/researchers/me
 * ═══════════════════════════════════════════════════════════════
 */
exports.getMe = async (req, res) => {
  try {
    const researcher = await Researcher.findById(req.researcher.id);
    if (!researcher) {
      return res.status(404).json({ message: "Researcher not found" });
    }

    res.json({ researcher: sanitize(researcher) });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch profile" });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * UPDATE RESEARCHER PROFILE
 * PUT /api/research/researchers/profile
 * ═══════════════════════════════════════════════════════════════
 */
exports.updateProfile = async (req, res) => {
  try {
    const allowed = [
      "firstName",
      "lastName",
      "phone",
      "institution",
      "discipline",
      "qualification",
      "bio",
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Keep name in sync
    if (updates.firstName || updates.lastName) {
      const current = await Researcher.findById(req.researcher.id);
      updates.name = `${updates.firstName || current.firstName} ${
        updates.lastName || current.lastName
      }`.trim();
    }

    const researcher = await Researcher.findByIdAndUpdate(
      req.researcher.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!researcher) {
      return res.status(404).json({ message: "Researcher not found" });
    }

    res.json({
      message: "Profile updated successfully",
      researcher: sanitize(researcher),
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ message: err.message || "Update failed" });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * CHANGE PASSWORD
 * POST /api/research/researchers/change-password
 * ═══════════════════════════════════════════════════════════════
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current and new password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    const researcher = await Researcher.findById(req.researcher.id).select(
      "+password"
    );

    // Verify current password
    const isPasswordValid = await researcher.matchPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    researcher.password = newPassword;
    await researcher.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({ message: err.message || "Password change failed" });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * REQUEST PASSWORD RESET
 * POST /api/research/researchers/forgot-password
 * ═══════════════════════════════════════════════════════════════
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const researcher = await Researcher.findOne({
      email: email.toLowerCase(),
    });

    if (!researcher) {
      // Don't reveal if email exists (security)
      return res.json({
        message: "If email exists, password reset link has been sent",
      });
    }

    // Generate reset token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    researcher.passwordResetToken = hashedToken;
    researcher.passwordResetExpire = expiry;
    await researcher.save();

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/research/reset-password?token=${rawToken}&email=${encodeURIComponent(
      email
    )}`;
    await researchEmail
      .sendPasswordResetEmail({
        email: researcher.email,
        name: researcher.firstName,
        resetLink,
      })
      .catch((err) =>
        console.error("[Email] sendPasswordResetEmail:", err.message)
      );

    res.json({
      message: "If email exists, password reset link has been sent",
      _devResetLink:
        process.env.NODE_ENV !== "production" ? resetLink : undefined,
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ message: err.message || "Password reset failed" });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * RESET PASSWORD WITH TOKEN
 * POST /api/research/researchers/reset-password
 * ═══════════════════════════════════════════════════════════════
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, password, confirmPassword } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({
        message: "Token, email, and password are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const researcher = await Researcher.findOne({
      email: email.toLowerCase(),
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpire");

    if (!researcher) {
      return res.status(400).json({
        message: "Password reset token is invalid or has expired",
      });
    }

    researcher.password = password;
    researcher.passwordResetToken = null;
    researcher.passwordResetExpire = null;
    await researcher.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: err.message || "Password reset failed" });
  }
};