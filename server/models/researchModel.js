const mongoose = require("mongoose");
const {
  RESEARCH_STAGES,
  RESEARCH_STATUSES,
  FEES,
} = require("../constants/researchIndex");

//  SCHEMA
const researchSchema = new mongoose.Schema(
  {
    researcher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Researcher",
      required: [true, "Researcher is required"],
      index: true,
    },

    researchId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      index: true,
    },
    discipline: {
      type: String,
      required: [true, "Discipline is required"],
      trim: true,
      index: true,
    },
    abstract: { type: String, trim: true },
    background: { type: String, trim: true },
    objectives: { type: String, trim: true },
    methodology: { type: String, trim: true },
    expectedOutcome: { type: String, trim: true },
    timeline: { type: String, trim: true },
    teamMembers: { type: String, trim: true },
    references: { type: String, trim: true },

    proposalFile: { type: String, default: null },
    proposalFileKey: { type: String, default: null }, // cloud storage object key
    finalPaperFile: { type: String, default: null },
    finalPaperFileKey: { type: String, default: null },

    finalAbstract: { type: String, trim: true },
    keywords: [{ type: String, trim: true }],

    stage: {
      type: String,
      enum: Object.values(RESEARCH_STAGES),
      default: RESEARCH_STAGES.PROPOSAL,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(RESEARCH_STATUSES),
      default: RESEARCH_STATUSES.PENDING,
      index: true,
    },

    assignedReviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Researcher",
    },
    assignedAt: { type: Date },

    reviewComment: { type: String, trim: true },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Researcher",
    },
    reviewedAt: { type: Date },
    resubmissionCount: { type: Number, default: 0, min: 0 },

    submissionPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    downloadPrice: {
      type: Number,
      default: FEES.DEFAULT_DOWNLOAD,
      min: [0, "Download price cannot be negative"],
    },
    downloads: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },

    nacostiPermit: { type: String, trim: true, default: null },
    nacostiSubmittedAt: { type: Date, default: null },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Researcher" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//  INDEXES

researchSchema.index({ researcher: 1, createdAt: -1 });
researchSchema.index({ stage: 1, status: 1 });
researchSchema.index({ isPublished: 1, createdAt: -1 });
researchSchema.index({ isPublished: 1, discipline: 1 });
researchSchema.index({ assignedReviewer: 1, status: 1 });
researchSchema.index({ isDeleted: 1, isPublished: 1 });
researchSchema.index(
  {
    title: "text",
    abstract: "text",
    finalAbstract: "text",
    discipline: "text",
    keywords: "text",
  },
  {
    name: "research_text_search",
    weights: {
      title: 10,
      abstract: 5,
      finalAbstract: 5,
      discipline: 3,
      keywords: 4,
    },
  },
);

researchSchema.virtual("canSubmitFinalPaper").get(function () {
  return (
    this.stage === RESEARCH_STAGES.PROPOSAL &&
    this.status === RESEARCH_STATUSES.APPROVED
  );
});

researchSchema.virtual("isReadyToPublish").get(function () {
  return (
    this.stage === RESEARCH_STAGES.FINAL_PAPER &&
    this.status === RESEARCH_STATUSES.APPROVED &&
    !this.isPublished
  );
});

researchSchema.methods.softDelete = async function (deletedByUserId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedByUserId;
  return this.save();
};

researchSchema.statics.generateResearchId = async function () {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({
    researchId: { $regex: `^NCRH-${year}-` },
  });
  const seq = String(count + 1).padStart(5, "0");
  return `NCRH-${year}-${seq}`;
};

researchSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model("Research", researchSchema);
