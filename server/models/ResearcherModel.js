const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const {
  RESEARCHER_ROLES,
  RESEARCHER_STATUSES,
  TOKEN_TTL,
} = require("../constants/researchIndex");

const researcherSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name must not exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name must not exceed 50 characters"],
    },

    name: {
      type: String,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Auth ───────────────────────────────────────────────────────────────
    password: {
      type: String,
      select: false,
      minlength: [8, "Password must be at least 8 characters"],
    },

    role: {
      type: String,
      enum: Object.values(RESEARCHER_ROLES),
      default: RESEARCHER_ROLES.RESEARCHER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(RESEARCHER_STATUSES),
      default: RESEARCHER_STATUSES.ACTIVE,
      index: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerificationToken: { type: String, select: false, default: null },
    emailVerificationExpire: { type: Date, select: false, default: null },

    passwordResetToken: { type: String, select: false, default: null },
    passwordResetExpire: { type: Date, select: false, default: null },

    invitationToken: { type: String, select: false, default: null },
    invitationExpire: { type: Date, select: false, default: null },
    invitedByAdminId: { type: String, default: null },
    invitedByAdminName: { type: String, default: null },
    invitedAt: { type: Date, default: null },
    invitationAcceptedAt: { type: Date, default: null },

    title: { type: String, trim: true, default: "" },
    institution: { type: String, trim: true, default: "", index: true },
    department: { type: String, trim: true, default: "" },
    discipline: { type: String, trim: true, default: "" },
    qualification: { type: String, trim: true, default: "" },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, "Bio must not exceed 1000 characters"],
      default: "",
    },
    location: { type: String, trim: true, default: "" },
    socialLinks: {
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    profileImage: { type: String, default: null },
    profileImageKey: { type: String, default: null },

    specialisations: { type: [String], default: [] },
    reviewCount: { type: Number, default: 0, min: 0 },
    acceptanceRate: { type: Number, default: 0, min: 0, max: 100 },

    notifications: {
      proposalApproved: { type: Boolean, default: true },
      proposalRejected: { type: Boolean, default: true },
      reviewComplete: { type: Boolean, default: true },
      newDownload: { type: Boolean, default: false },
      systemUpdates: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
    },

    isActive: { type: Boolean, default: true, index: true },
    deactivatedAt: { type: Date, default: null },
    lastLogin: { type: Date, default: null },
    isCommittee: { type: Boolean, default: false, index: true },
    committeeSince: { type: Date, default: null },
    promotedFromReviewer: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

researcherSchema.index({ role: 1, specialisations: 1 });
researcherSchema.index({ role: 1, status: 1 });
researcherSchema.index({ role: 1, institution: 1 });
researcherSchema.index({
  emailVerificationToken: 1,
  emailVerificationExpire: 1,
});
researcherSchema.index({ passwordResetToken: 1, passwordResetExpire: 1 });
researcherSchema.index({ invitationToken: 1, invitationExpire: 1 });
researcherSchema.index(
  { name: "text", email: "text", institution: "text", discipline: "text" },
  {
    name: "researcher_text_search",
    weights: { name: 10, email: 5, institution: 3, discipline: 2 },
  },
);
researcherSchema.index({ role: 1, isCommittee: 1 });

researcherSchema.virtual("displayName").get(function () {
  return this.title ? `${this.title} ${this.name}` : this.name;
});

researcherSchema.virtual("isReviewer").get(function () {
  return this.role === RESEARCHER_ROLES.REVIEWER;
});

researcherSchema.virtual("hasCommitteeAccess").get(function () {
  return (
    this.role === RESEARCHER_ROLES.RESEARCH_COMMITTEE || this.isCommittee === true
  );
});

researcherSchema.pre("save", async function (next) {
  // Sync name from firstName + lastName
  if (this.isModified("firstName") || this.isModified("lastName")) {
    this.name = `${this.firstName} ${this.lastName}`.trim();
  }

  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

researcherSchema.methods.matchPassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

researcherSchema.methods.generateToken = function (type, ttlHours) {
  const raw = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");

  const map = {
    verification: {
      tokenField: "emailVerificationToken",
      expireField: "emailVerificationExpire",
      defaultTTL: TOKEN_TTL.EMAIL_VERIFICATION,
    },
    reset: {
      tokenField: "passwordResetToken",
      expireField: "passwordResetExpire",
      defaultTTL: TOKEN_TTL.PASSWORD_RESET,
    },
    invite: {
      tokenField: "emailVerificationToken",
      expireField: "emailVerificationExpire",
      defaultTTL: TOKEN_TTL.REVIEWER_INVITE,
    },
  };

  const { tokenField, expireField, defaultTTL } = map[type];
  const hours = ttlHours || defaultTTL;

  this[tokenField] = hashed;
  this[expireField] = new Date(Date.now() + hours * 60 * 60 * 1000);

  return raw;
};

researcherSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpire;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpire;
  delete obj.invitationToken;
  delete obj.invitationExpire;
  return obj;
};

researcherSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

researcherSchema.statics.findActiveReviewers = function (specialisation) {
  const query = {
    role: RESEARCHER_ROLES.REVIEWER,
    status: RESEARCHER_STATUSES.ACTIVE,
    isActive: true,
  };
  if (specialisation) query.specialisations = specialisation;
  return this.find(query);
};

researcherSchema.statics.findCommitteeMembers = function () {
  return this.find({
    $or: [{ role: RESEARCHER_ROLES.RESEARCH_COMMITTEE }, { isCommittee: true }],
    isActive: true,
  });
};

researcherSchema.statics.findPendingInvitations = function () {
  return this.find({
    role: RESEARCHER_ROLES.REVIEWER,
    status: RESEARCHER_STATUSES.INVITED,
    emailVerificationExpire: { $gt: new Date() },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
module.exports = mongoose.model("Researcher", researcherSchema);
