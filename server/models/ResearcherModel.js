const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const crypto   = require("crypto");

const researcherSchema = new mongoose.Schema(
  {

    firstName: {
      type:     String,
      required: [true, "First name is required"],
      trim:     true,
    },
    lastName: {
      type:     String,
      required: [true, "Last name is required"],
      trim:     true,
    },
    name: {
     
      type:  String,
      trim:  true,
      index: true,
    },
    email: {
      type:      String,
      required:  [true, "Email is required"],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
      index:     true,
    },
    phone: {
      type:  String,
      trim:  true,
      default: "",
    },
    password: {
      type:     String,
      select:   false,          // never returned in queries unless explicitly asked
      minlength: 8,
    },
    profileImage: {
      type:    String,
      default: null,
    },
    profileImageKey: {
      type:    String,          // storage object key for deletion
      default: null,
    },

   
    role: {
      type:    String,
      enum:    ["researcher", "reviewer", "admin"],
      default: "researcher",
      index:   true,
    },
    // Researchers self-register (status: "active" after email verification)
    // Reviewers are invited by admin (status: "invited" → "active" after accepting)
    status: {
      type:    String,
      enum:    ["active", "invited", "inactive", "suspended"],
      default: "active",
      index:   true,
    },

    // ── Invitation Details (for reviewers) ──────────────────────────────

    invitationToken:  { type: String, select: false, default: null },
    invitationExpire: { type: Date,   select: false, default: null },
    invitedBy: {
      // ObjectId of admin who invited this reviewer
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "User", 
      default: null,
    },
    invitedAt: {
      type:    Date,
      default: null,
    },
    invitationAcceptedAt: {
      type:    Date,
      default: null,
    },

    // ── Academic/Professional Info ──────────────────────────────────────
    title: {
      type:  String,            // e.g. "Dr.", "Prof.", "Mr."
      trim:  true,
      default: "",
    },
    institution: {
      type:  String,
      trim:  true,
      default: "",
    },
    department: {
      type:  String,
      trim:  true,
      default: "",
    },
    discipline: {
      type:  String,
      trim:  true,
      default: "",
    },
    qualification: {
      type:  String,            
      trim:  true,
      default: "",
    },
    bio: {
      type:     String,
      trim:     true,
      maxlength: [1000, "Bio must not exceed 1000 characters"],
      default:  "",
    },
    location: {
      type:  String,
      trim:  true,
      default: "",
    },
    socialLinks: {
      twitter:  { type: String, default: "" },
      linkedin: { type: String, default: "" },
      website:  { type: String, default: "" },
    },

    // ── Reviewer-specific Fields ────────────────────────────────────────
    specialisations: {

      type:    [String],
      default: [],
    },
    reviewCount: {
      
      type:    Number,
      default: 0,
      min:     0,
    },
    acceptanceRate: {
    
      type:    Number,
      default: 0,
      min:     0,
      max:     100,
    },


    notifications: {
      proposalApproved: { type: Boolean, default: true  },
      proposalRejected: { type: Boolean, default: true  },
      reviewComplete:   { type: Boolean, default: true  },
      newDownload:      { type: Boolean, default: false },
      systemUpdates:    { type: Boolean, default: true  },
      weeklyDigest:     { type: Boolean, default: false },
    },

    // ── Email Verification (for self-registered researchers) ────────────
    emailVerified: {
      type:    Boolean,
      default: false,
      index:   true,
    },
    emailVerificationToken:  { type: String, select: false, default: null },
    emailVerificationExpire: { type: Date,   select: false, default: null },

    passwordResetToken:  { type: String, select: false, default: null },
    passwordResetExpire: { type: Date,   select: false, default: null },

    // ── Account Status ──────────────────────────────────────────────────
    isActive:   { type: Boolean, default: true,  index: true },
    deactivatedAt: { type: Date, default: null },

    // ── Tracking ────────────────────────────────────────────────────────
    lastLogin: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true,       // createdAt, updatedAt
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Find reviewers by specialization
researcherSchema.index({ role: 1, specialisations: 1 });

// Find researchers by institution
researcherSchema.index({ role: 1, institution: 1 });

// Status filters (researchers, reviewers)
researcherSchema.index({ role: 1, status: 1 });

// Full-text search across name, email, institution, discipline
researcherSchema.index(
  { name: "text", email: "text", institution: "text", discipline: "text" },
  { name: "researcher_text_search", weights: { name: 10, email: 5, institution: 3, discipline: 2 } }
);

// Find pending invitations
researcherSchema.index({ invitationToken: 1, invitationExpire: 1 });


researcherSchema.virtual("joiningDate").get(function () {
  return this.createdAt;
});

researcherSchema.virtual("displayName").get(function () {
  return this.title ? `${this.title} ${this.name}` : this.name;
});

researcherSchema.virtual("isInvited").get(function () {
  return this.status === "invited";
});

researcherSchema.virtual("isReviewer").get(function () {
  return this.role === "reviewer";
});

researcherSchema.virtual("isResearcher").get(function () {
  return this.role === "researcher";
});


researcherSchema.pre("save", async function (next) {
  if (this.isModified("firstName") || this.isModified("lastName")) {
    this.name = `${this.firstName} ${this.lastName}`.trim();
  }

  // Hash password only if modified and exists
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});


researcherSchema.methods.matchPassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

researcherSchema.methods.generateToken = function (field, ttlHours = 72) {
  const raw    = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");

  const tokenField  = field === "reset" ? "passwordResetToken"        : "emailVerificationToken";
  const expireField = field === "reset" ? "passwordResetExpire"        : "emailVerificationExpire";

  this[tokenField]  = hashed;
  this[expireField] = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  return raw; // Return raw token to send in email, not the hash
};


researcherSchema.methods.generateInvitationToken = function (ttlHours = 72) {
  const raw    = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");

  this.invitationToken  = hashed;
  this.invitationExpire = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  return raw;
};

// Get public profile (safe for external sharing)
 
researcherSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    name: this.displayName,
    email: this.email,
    institution: this.institution,
    discipline: this.discipline,
    bio: this.bio,
    profileImage: this.profileImage,
    // Only expose reviewer stats if reviewer
    ...(this.isReviewer && {
      reviewCount: this.reviewCount,
      acceptanceRate: this.acceptanceRate,
      specialisations: this.specialisations,
    }),
  };
};

// Get full profile (only for own account or admin)
 
researcherSchema.methods.getFullProfile = function () {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    status: this.status,
    title: this.title,
    institution: this.institution,
    department: this.department,
    discipline: this.discipline,
    qualification: this.qualification,
    bio: this.bio,
    location: this.location,
    socialLinks: this.socialLinks,
    profileImage: this.profileImage,
    ...(this.isReviewer && {
      specialisations: this.specialisations,
      reviewCount: this.reviewCount,
      acceptanceRate: this.acceptanceRate,
    }),
    emailVerified: this.emailVerified,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
  };
};

/**
 * Remove sensitive fields for API responses
 */
researcherSchema.methods.toJSON = function () {
  const obj = this.toObject();
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
  return this.findOne({ email: email.toLowerCase() });
};

researcherSchema.statics.findActiveResearchers = function () {
  return this.find({ role: "researcher", status: "active", isActive: true });
};


researcherSchema.statics.findActiveReviewers = function (specialization) {
  const query = { role: "reviewer", status: "active", isActive: true };
  if (specialization) {
    query.specialisations = specialization;
  }
  return this.find(query);
};

researcherSchema.statics.findPendingInvitations = function () {
  return this.find({
    role: "reviewer",
    status: "invited",
    invitationExpire: { $gt: new Date() },
  });
};


const Researcher = mongoose.model("Researcher", researcherSchema);

module.exports = Researcher; 