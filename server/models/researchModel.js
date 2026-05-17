const mongoose = require("mongoose");

const researchSchema = new mongoose.Schema(
  {
    researcher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Researcher",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    discipline: {
      type: String,
      required: true,
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
    proposalFile: { type: String },
    finalAbstract: { type: String, trim: true },
    keywords: [{ type: String, trim: true }],
    finalPaperFile: { type: String },

    submissionPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    downloadPrice: {
      type: Number,
      // default: 150,  // KES - amount public pays to download
      default: 1, // Set to 1 KES for testing. Change to 150 for production.
      min: 0,
    },

    stage: {
      type: String,
      enum: ["proposal", "abstract", "final_paper"],
      default: "proposal",
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    //assign reviewer/admin comments and details when research is reviewed
    assignedReviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Researcher", // same ref as reviewedBy
    },
    assignedAt: { type: Date },
    publishedAt: { type: Date },

    reviewComment: { type: String, trim: true },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Researcher", // reviewer/admin who reviewed
    },
    reviewedAt: { type: Date },

    resubmissionCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    downloads: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

researchSchema.index({ researcher: 1, createdAt: -1 });
researchSchema.index({ stage: 1, status: 1 });
researchSchema.index({ isPublished: 1, createdAt: -1 });
researchSchema.index({ discipline: 1, isPublished: 1 });
researchSchema.index(
  { title: "text", abstract: "text", discipline: "text", keywords: "text" },
  {
    name: "research_text_search",
    weights: { title: 10, abstract: 5, discipline: 3 },
  },
);

researchSchema.virtual("totalRevenue").get(function () {
  return 0;
});

researchSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "approved" &&
    this.stage === "final_paper"
  ) {
    // this.isPublished = true;
  }
  next();
});

researchSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

researchSchema.methods.canSubmitFinalPaper = function () {
  return this.stage === "proposal" && this.status === "approved";
};

researchSchema.methods.getPaymentStatus = async function () {
  if (!this.submissionPayment) {
    return { paid: false, receipt: null };
  }

  const Payment = mongoose.model("Payment");
  const payment = await Payment.findById(this.submissionPayment);

  return {
    paid: payment?.status === "completed",
    receipt: payment?.mpesaReceiptNumber,
    amount: payment?.amount,
  };
};

module.exports = mongoose.model("Research", researchSchema);
