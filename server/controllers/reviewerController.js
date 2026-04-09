const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Researcher = require("../models/ResearcherModel");
const researchEmail = require("../utils/emailServices");

/**
 * Sign a JWT token for reviewer/admin
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
 * Check if caller can manage reviewers
 * - Staff admin (req.user with admin/superadmin role)
 * - Research admin (req.researcher with admin role)
 */
const canManageReviewers = (req) => {
  const staffAdmin = req.user && ["superadmin", "admin"].includes(req.user.role);
  const researchAdmin =
    req.researcher && req.researcher.role === "admin";
  return staffAdmin || researchAdmin;
};

/**
 * Get caller's name for emails
 */
const getCallerName = (req) => {
  if (req.user) {
    return req.user.name || `${req.user.firstName} ${req.user.lastName}`.trim();
  }
  if (req.researcher) {
    return req.researcher.name || "Research Administrator";
  }
  return "Administration";
};

/**
 * ═══════════════════════════════════════════════════════════════
 * INVITE REVIEWER
 * POST /api/research/reviewers/invite
 * Admin only - creates new reviewer account with invite link
 * ═══════════════════════════════════════════════════════════════
 */
exports.inviteReviewer = async (req, res) => {
  // Check authorization
  if (!canManageReviewers(req)) {
    return res.status(403).json({
      message:
        "Only admins can invite reviewers",
    });
  }

  try {
    const { firstName, lastName, email, institution, discipline, specialisations } =
      req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        message: "firstName, lastName, and email are required",
      });
    }

    // Check if email already exists
    const existing = await Researcher.findOne({
      email: email.toLowerCase(),
    });

    // Case A: Existing researcher → promote to reviewer
    if (existing) {
      if (["reviewer", "admin"].includes(existing.role)) {
        return res.status(409).json({
          message: `${existing.name} already has role: ${existing.role}`,
        });
      }

      existing.role = "reviewer";
      existing.specialisations = specialisations || [];
      await existing.save();

      // Send promotion email
      await researchEmail
        .sendReviewerPromoted({
          email: existing.email,
          name: existing.name,
          promotedBy: getCallerName(req),
        })
        .catch((err) =>
          console.error("[Email] sendReviewerPromoted:", err.message)
        );

      return res.status(200).json({
        message: `${existing.name} has been promoted to reviewer`,
        reviewer: sanitize(existing),
      });
    }

    // Case B: New email → create reviewer account with invite link
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiry = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    const reviewer = await Researcher.create({
      firstName,
      lastName,
      email,
      institution: institution || "",
      discipline: discipline || "",
      specialisations: specialisations || [],
      role: "reviewer",
      status: "invited",
      password: crypto.randomBytes(16).toString("hex"), // Temporary password
      emailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpire: expiry,
      invitedBy: req.user?.id || req.researcher?.id,
      invitedAt: new Date(),
    });

    // Generate invite link
    const inviteLink = `${process.env.FRONTEND_URL}/research/set-password?token=${rawToken}&email=${encodeURIComponent(
      email
    )}`;

    // Send invitation email
    await researchEmail
      .sendReviewerInvite({
        email: reviewer.email,
        name: reviewer.firstName,
        inviteLink,
        invitedBy: getCallerName(req),
      })
      .catch((err) =>
        console.error("[Email] sendReviewerInvite:", err.message)
      );

    console.log(
      `[DEV] Reviewer invite link for ${email}: ${inviteLink}`
    );

    res.status(201).json({
      message: `Invite sent to ${email}. They have 72 hours to set their password.`,
      reviewer: sanitize(reviewer),
      _devInviteLink:
        process.env.NODE_ENV !== "production" ? inviteLink : undefined,
    });
  } catch (err) {
    console.error("inviteReviewer error:", err);
    res.status(500).json({ message: err.message || "Invitation failed" });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * SET PASSWORD (Reviewer Accepts Invitation)
 * POST /api/research/reviewers/set-password
 * Public endpoint - called when reviewer clicks invite link
 * ═══════════════════════════════════════════════════════════════
 */
exports.setPassword = async (req, res) => {
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

    const reviewer = await Researcher.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: new Date() },
      role: "reviewer",
    }).select("+emailVerificationToken +emailVerificationExpire +password");

    if (!reviewer) {
      return res.status(400).json({
        message:
          "Invite link is invalid or has expired. Ask admin to resend.",
      });
    }

    reviewer.password = password; // Pre-save hook will hash it
    reviewer.emailVerified = true;
    reviewer.status = "active";
    reviewer.emailVerificationToken = null;
    reviewer.emailVerificationExpire = null;
    reviewer.invitationAcceptedAt = new Date();
    await reviewer.save();

    const jwtToken = signToken(reviewer._id, reviewer.role);

    res.json({
      message: "Password set successfully. You can now log in.",
      token: jwtToken,
      reviewer: sanitize(reviewer),
    });
  } catch (err) {
    console.error("setPassword error:", err);
    res.status(500).json({ message: err.message || "Password setup failed" });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * RESEND INVITATION
 * POST /api/research/reviewers/:id/resend-invite
 * Admin only - resends invite if token expired
 * ═══════════════════════════════════════════════════════════════
 */
exports.resendInvite = async (req, res) => {
  if (!canManageReviewers(req)) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const reviewer = await Researcher.findById(req.params.id);

    if (!reviewer) {
      return res.status(404).json({ message: "Reviewer not found" });
    }

    if (reviewer.emailVerified) {
      return res.status(400).json({
        message:
          "This reviewer has already set their password and accepted the invitation",
      });
    }

    if (reviewer.role !== "reviewer") {
      return res.status(400).json({
        message: `${reviewer.name} is not a reviewer`,
      });
    }

    // Generate fresh token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    reviewer.emailVerificationToken = hashedToken;
    reviewer.emailVerificationExpire = new Date(
      Date.now() + 72 * 60 * 60 * 1000
    );
    await reviewer.save();

    const inviteLink = `${process.env.FRONTEND_URL}/research/set-password?token=${rawToken}&email=${encodeURIComponent(
      reviewer.email
    )}`;

    // Send new invite email
    await researchEmail
      .sendReviewerInvite({
        email: reviewer.email,
        name: reviewer.firstName,
        inviteLink,
        invitedBy: getCallerName(req),
      })
      .catch((err) =>
        console.error("[Email] resendInvite:", err.message)
      );

    console.log(`[DEV] Resent invite link to ${reviewer.email}: ${inviteLink}`);

    res.json({
      message: `Invite resent to ${reviewer.email}`,
      _devInviteLink:
        process.env.NODE_ENV !== "production" ? inviteLink : undefined,
    });
  } catch (err) {
    console.error("resendInvite error:", err);
    res.status(500).json({ message: err.message || "Resend failed" });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * REVOKE REVIEWER (Demote Back to Researcher)
 * PATCH /api/research/reviewers/:id/revoke
 * Admin only
 * ═══════════════════════════════════════════════════════════════
 */
exports.revokeReviewer = async (req, res) => {
  if (!canManageReviewers(req)) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const reviewer = await Researcher.findById(req.params.id);

    if (!reviewer) {
      return res.status(404).json({ message: "Reviewer not found" });
    }

    if (reviewer.role === "admin") {
      return res.status(403).json({
        message: "Cannot revoke admin accounts via this endpoint",
      });
    }

    if (reviewer.role !== "reviewer") {
      return res.status(400).json({
        message: `${reviewer.name} is not a reviewer`,
      });
    }

    reviewer.role = "researcher";
    reviewer.specialisations = [];
    await reviewer.save();

    res.json({
      message: `${reviewer.name}'s reviewer access has been revoked`,
      researcher: sanitize(reviewer),
    });
  } catch (err) {
    console.error("revokeReviewer error:", err);
    res.status(500).json({ message: err.message || "Revoke failed" });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * PROMOTE TO ADMIN
 * PATCH /api/research/reviewers/:id/promote-admin
 * Admin only
 * ═══════════════════════════════════════════════════════════════
 */
exports.promoteToAdmin = async (req, res) => {
  if (!canManageReviewers(req)) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const researcher = await Researcher.findById(req.params.id);

    if (!researcher) {
      return res.status(404).json({ message: "Researcher not found" });
    }

    if (researcher.role === "admin") {
      return res.status(400).json({
        message: `${researcher.name} is already an admin`,
      });
    }

    researcher.role = "admin";
    await researcher.save();

    res.json({
      message: `${researcher.name} promoted to research admin`,
      researcher: sanitize(researcher),
    });
  } catch (err) {
    console.error("promoteToAdmin error:", err);
    res.status(500).json({ message: err.message || "Promotion failed" });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * LIST REVIEWERS
 * GET /api/research/reviewers
 * Admin only - list all reviewers
 * ═══════════════════════════════════════════════════════════════
 */
exports.listReviewers = async (req, res) => {
  if (!canManageReviewers(req)) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const reviewers = await Researcher.find({
      role: { $in: ["reviewer", "admin"] },
    })
      .select(
        "name email role institution discipline specialisations emailVerified createdAt invitedAt"
      )
      .sort({ createdAt: -1 });

    res.json({ count: reviewers.length, reviewers });
  } catch (err) {
    console.error("listReviewers error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * LIST ALL RESEARCHERS (WITH FILTERS)
 * GET /api/research/reviewers/all
 * Admin only - list all researchers with optional role filter
 * Query: ?role=researcher|reviewer|admin&page=1&limit=20
 * ═══════════════════════════════════════════════════════════════
 */
exports.listAllResearchers = async (req, res) => {
  if (!canManageReviewers(req)) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = role ? { role } : {};

    const [researchers, total] = await Promise.all([
      Researcher.find(filter)
        .select(
          "name email role institution discipline emailVerified createdAt invitedAt status"
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Researcher.countDocuments(filter),
    ]);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      researchers,
    });
  } catch (err) {
    console.error("listAllResearchers error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * UPDATE REVIEWER DETAILS
 * PUT /api/research/reviewers/:id
 * Admin only - update reviewer specializations, institution, etc
 * ═══════════════════════════════════════════════════════════════
 */
exports.updateReviewer = async (req, res) => {
  if (!canManageReviewers(req)) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const allowed = [
      "specialisations",
      "institution",
      "discipline",
      "bio",
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const reviewer = await Researcher.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!reviewer) {
      return res.status(404).json({ message: "Reviewer not found" });
    }

    res.json({
      message: "Reviewer updated successfully",
      reviewer: sanitize(reviewer),
    });
  } catch (err) {
    console.error("updateReviewer error:", err);
    res.status(500).json({ message: err.message || "Update failed" });
  }
};