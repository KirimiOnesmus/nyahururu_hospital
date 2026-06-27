const mongoose = require("mongoose");
const {
  RESEARCH_STAGES,
  REVIEW_DECISIONS,
} = require("../constants/researchIndex");

const reviewSchema = new mongoose.Schema(
  {
    research: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Research",
      required: [true, "Research reference is required"],
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Researcher",
      required: [true, "Reviewer reference is required"],
      index: true,
    },

    stage: {
      type: String,
      enum: Object.values(RESEARCH_STAGES),
      required: [true, "Stage is required"],
    },

    round: {
      type: Number,
      default: 1,
      min: 1,
    },

    decision: {
      type: String,
      enum: Object.values(REVIEW_DECISIONS),
      required: [true, "Decision is required"],
    },

    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [10, "Comment must be at least 10 characters"],
    },

    criteria: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    reviewerRole: {
      type: String,
      enum: ["reviewer", "committee"],
      required: true,
    },

    // Meaningful only for reviewerRole: "reviewer" — a single member's
    // first-pass decision per stage. Committee votes are ALWAYS created
    // with isLatest: false (see researchService.submitCommitteeReview),
    // since multiple committee members' votes legitimately coexist for the
    // same research+stage+round — there is no single "latest" among them.
    isLatest: { type: Boolean, default: true, index: true },

    submittedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ research: 1, stage: 1, isLatest: 1 });
reviewSchema.index({ reviewer: 1, submittedAt: -1 });
reviewSchema.index({ research: 1, round: -1 });

//  Committee quorum voting support 

// Prevents the same committee member voting twice in the same round —
// enforced at the DB level, not just in the service layer, to close the
// race condition where two near-simultaneous requests both pass the
// service's pre-check before either has written its vote.
reviewSchema.index(
  { research: 1, stage: 1, round: 1, reviewer: 1 },
  {
    unique: true,
    partialFilterExpression: { reviewerRole: "committee" },
  },
);

// Supports the actual hot-path query in submitCommitteeReview — counting
// and listing all votes cast for a given research+stage+round, WITHOUT
// filtering by reviewer. The unique index above can't serve this query
// efficiently since `reviewer` sits inside its key; Mongo needs a
// reviewer-less prefix to use an index for "all votes in this round".
reviewSchema.index({ research: 1, stage: 1, reviewerRole: 1, round: 1 });

reviewSchema.pre("save", async function (next) {
  if (this.isNew && this.isLatest) {
    await this.constructor.updateMany(
      {
        research: this.research,
        stage: this.stage,
        isLatest: true,
        _id: { $ne: this._id },
      },
      { $set: { isLatest: false } },
    );
  }
  next();
});

//  STATIC METHODS

reviewSchema.statics.getLatest = function (researchId, stage) {
  return this.findOne({ research: researchId, stage, isLatest: true }).populate(
    "reviewer",
    "name email institution",
  );
};

reviewSchema.statics.getAllForResearch = function (researchId) {
  return this.find({ research: researchId })
    .populate("reviewer", "name email institution")
    .sort({ round: -1, submittedAt: -1 });
};

reviewSchema.statics.getReviewerStats = async function (reviewerId) {
  const results = await this.aggregate([
    { $match: { reviewer: new mongoose.Types.ObjectId(reviewerId) } },
    {
      $group: {
        _id: "$decision",
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = { total: 0, approved: 0, revision: 0, rejected: 0 };
  results.forEach((r) => {
    stats[r._id] = r.count;
    stats.total += r.count;
  });
  stats.acceptanceRate = stats.total
    ? Math.round((stats.approved / stats.total) * 100)
    : 0;

  return stats;
};

/**
 * All committee votes for a given research+stage+round, in the order they
 * were cast. Used by researchService.getCommitteeVotes() to show the
 * committee's full per-member breakdown at final-approval time.
 */
reviewSchema.statics.getCommitteeRoundVotes = function (researchId, stage, round) {
  return this.find({
    research: researchId,
    stage,
    reviewerRole: "committee",
    round,
  })
    .populate("reviewer", "name firstName lastName email")
    .sort({ submittedAt: 1 });
};

module.exports = mongoose.model("Review", reviewSchema);