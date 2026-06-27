const mongoose = require("mongoose");
const {
  RESEARCH_STAGES,
  RESEARCH_STATUSES,
  FEES,
} = require("../constants/researchIndex");

const reviewSnapshotSchema = {
  decision: { type: String, default: null },
  comment: { type: String, trim: true, default: null },
  criteria: { type: mongoose.Schema.Types.Mixed, default: {} },
  aggregateScore: { type: Number, default: null, min: 0, max: 10 },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Researcher",
    default: null,
  },
  reviewedAt: { type: Date, default: null },
};

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

    // Stage 1: Ethics & Funding
    hypotheses: { type: String, trim: true },
    literatureReviewSummary: { type: String, trim: true },
    studyDuration: { type: String, trim: true },
    studySites: [{ type: String, trim: true }],
    coInvestigators: [{ type: String, trim: true }],
    fundingSource: { type: String, trim: true },
    ethicsInformation: { type: String, trim: true },

    //  Files
    proposalFile: { type: String, default: null },
    proposalFileKey: { type: String, default: null },

    //  Stage 2: Progress
    progressData: {
      methodology: { type: String, trim: true },
      studyDesign: { type: String, trim: true },
      samplingMethod: { type: String, trim: true },
      sampleSizeAchieved: { type: Number, min: 0 },
      sampleSizeTarget: { type: Number, min: 0 },
      dataCollectionProgress: { type: String, trim: true },
      statisticalMethods: { type: String, trim: true },
      analysisTools: { type: String, trim: true },
      preliminaryFindings: { type: String, trim: true },
      deviationsFromProtocol: { type: String, trim: true },
      ethicalIncidents: { type: String, trim: true },
      participantWithdrawals: { type: String, trim: true },
      submittedAt: { type: Date },
      savedAt: { type: Date },
    },
    progressFiles: [
      {
        label: { type: String, trim: true },
        url: { type: String, trim: true },
        key: { type: String, trim: true },
      },
    ],

    priority: {
      type: String,
      enum: ["high", "medium", "normal"],
      default: "normal",
    },
    reviewDeadline: { type: Date, default: null },
    //  Stage 3: Final Paper
    finalPaperFile: { type: String, default: null },
    finalPaperFileKey: { type: String, default: null },
    finalAbstract: { type: String, trim: true },
    keywords: [{ type: String, trim: true }],
    finalPaperFiles: [
      {
        label: { type: String, trim: true },
        url: { type: String, trim: true },
        key: { type: String, trim: true },
      },
    ],
    finalPaperSubmission: {
      supportingFiles: {
        finalDataset: { url: String, key: String },
        dataDictionary: { url: String, key: String },
        statisticalScripts: { url: String, key: String },
        ethicsApproval: { url: String, key: String },
        fundingDisclosure: { url: String, key: String },
      },
      declarations: {
        conflictOfInterestDeclared: { type: Boolean, default: false },
        aiUsageDeclared: { type: Boolean, default: false },
        aiUsageDetails: { type: String, trim: true, maxlength: 2000 },
      },
      plagiarismReportLink: { type: String, trim: true },
      fundingSource: { type: String, trim: true, maxlength: 300 },
      noteToCommittee: { type: String, trim: true, maxlength: 2000 },
    },

    //  Publication
    journalName: { type: String, trim: true },
    journalVolume: { type: String, trim: true },
    journalDoi: { type: String, trim: true },

    //  Workflow
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

    proposalReview: reviewSnapshotSchema,
    progressReview: reviewSnapshotSchema,
    finalPaperReview: reviewSnapshotSchema,

    // ── Generic "latest decision, whichever stage" fields ──────────────
   
    reviewComment: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Researcher" },
    reviewedAt: { type: Date },

    resubmissionCount: { type: Number, default: 0, min: 0 },
    submissionPayment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },

    // ── Committee quorum voting ─────────────────────────────────────────
  
    committeeRound: { type: Number, default: 1, min: 1 },

    committeeReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Researcher",
      default: null,
    },
    committeeReviewedAt: { type: Date, default: null },

    committeeComment: { type: String, default: "" },
    reactivatedAt: { type: Date, default: null },
    reactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Researcher" },
    reactivationReason: { type: String, trim: true, default: null },

    aggregateScore: { type: Number, default: null, min: 0, max: 10 },
    reviewDecision: { type: String, default: null },

    // NACOSTI
    nacostiPermit: { type: String, trim: true, default: null },
    nacostiSubmittedAt: { type: Date, default: null },

    //  Certificates
    clearanceCertificate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certificate",
    },
    completionCertificate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certificate",
    },

    //  Publishing
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    downloadPrice: {
      type: Number,
      default: FEES.DEFAULT_DOWNLOAD,
      min: [0, "Download price cannot be negative"],
    },
    downloads: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },

    //  Soft Delete
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

// INDEXES

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

//  VIRTUALS

researchSchema.virtual("canSubmitProgress").get(function () {
  return (
    this.stage === RESEARCH_STAGES.PROPOSAL &&
    this.status === RESEARCH_STATUSES.APPROVED
  );
});

researchSchema.virtual("canSubmitFinalPaper").get(function () {
  return (
    this.stage === RESEARCH_STAGES.PROGRESS &&
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

//  METHODS

researchSchema.methods.softDelete = async function (deletedByUserId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedByUserId;
  return this.save();
};

// STATICS

researchSchema.statics.generateResearchId = async function () {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({
    researchId: { $regex: `^NCRH-${year}-` },
  });
  const seq = String(count + 1).padStart(5, "0");
  return `NCRH-${year}-${seq}`;
};

researchSchema.statics.findSimilarTitles = async function (
  title,
  { excludeId, threshold = 0.85 } = {},
) {
  const filter = { $text: { $search: title } };
  if (excludeId) filter._id = { $ne: excludeId };
  const candidates = await this.find(filter, {
    score: { $meta: "textScore" },
    title: 1,
  })
    .sort({ score: { $meta: "textScore" } })
    .limit(5)
    .lean();
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const a = normalize(title);
  return candidates.filter((c) => {
    const b = normalize(c.title);
    const longer = Math.max(a.length, b.length) || 1;
    const distance = levenshtein(a, b);
    return 1 - distance / longer >= threshold;
  });
};

//  HELPERS (module-scoped)

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array(b.length).fill(0),
  ]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// MIDDLEWARE

researchSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model("Research", researchSchema); 