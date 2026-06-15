
const mongoose = require("mongoose");
const { RESEARCH_STAGES, REVIEW_DECISIONS } = require("../constants/researchIndex");

const reviewSchema = new mongoose.Schema(
  {
    research: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Research",
      required: [true, "Research reference is required"],
      index:    true,
    },
    reviewer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Researcher",
      required: [true, "Reviewer reference is required"],
      index:    true,
    },

    stage: {
      type:     String,
      enum:     Object.values(RESEARCH_STAGES),
      required: [true, "Stage is required"],
    },

    round: {
      type:    Number,
      default: 1,
      min:     1,
    },

    decision: {
      type:     String,
      enum:     Object.values(REVIEW_DECISIONS),
      required: [true, "Decision is required"],
    },


    comment: {
      type:     String,
      required: [true, "Review comment is required"],
      trim:     true,
      minlength: [10, "Comment must be at least 10 characters"],
    },


    criteria: {
      clarity:     { type: Number, min: 1, max: 5 },
      methodology: { type: Number, min: 1, max: 5 },
      originality: { type: Number, min: 1, max: 5 },
      relevance:   { type: Number, min: 1, max: 5 },
    },


    isLatest: { type: Boolean, default: true, index: true },

    submittedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);


reviewSchema.index({ research: 1, stage: 1, isLatest: 1 });
reviewSchema.index({ reviewer: 1, submittedAt: -1 });
reviewSchema.index({ research: 1, round: -1 });


reviewSchema.pre("save", async function (next) {
  if (this.isNew && this.isLatest) {
    await this.constructor.updateMany(
      {
        research:  this.research,
        stage:     this.stage,
        isLatest:  true,
        _id:       { $ne: this._id },
      },
      { $set: { isLatest: false } }
    );
  }
  next();
});


//  STATIC METHODS


reviewSchema.statics.getLatest = function (researchId, stage) {
  return this.findOne({ research: researchId, stage, isLatest: true })
    .populate("reviewer", "name email institution");
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
        _id:           "$decision",
        count:         { $sum: 1 },
      },
    },
  ]);

  const stats = { total: 0, approved: 0, revision: 0, rejected: 0 };
  results.forEach((r) => {
    stats[r._id]  = r.count;
    stats.total  += r.count;
  });
  stats.acceptanceRate = stats.total
    ? Math.round((stats.approved / stats.total) * 100)
    : 0;

  return stats;
};


module.exports = mongoose.model("Review", reviewSchema);