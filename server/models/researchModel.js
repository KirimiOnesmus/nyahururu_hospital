const mongoose = require("mongoose");

const researchSchema = new mongoose.Schema({
  researcher: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "Researcher",
    required: true,
    index:    true,
  },

  title:      { 
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

  abstract:        { type: String, trim: true },
  background:      { type: String, trim: true },
  objectives:      { type: String, trim: true },
  methodology:     { type: String, trim: true },
  expectedOutcome: { type: String, trim: true },
  timeline:        { type: String, trim: true },
  teamMembers:     { type: String, trim: true },
  references:      { type: String, trim: true },
  proposalFile:    { type: String },  
  finalAbstract:  { type: String, trim: true },
  keywords:       [{ type: String, trim: true }],
  finalPaperFile: { type: String },  


  submissionPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  "Payment",  // Links to the 150 KES proposal payment
  },

  downloadPrice:  { 
    type: Number, 
    default: 150,  // KES - amount public pays to download
  },


  stage: {
    type:    String,
    enum:    ["proposal", "abstract", "final_paper"],
    default: "proposal",
    index:   true,
  },

  status: {
    type:    String,
    enum:    ["pending", "approved", "rejected"],
    default: "pending",
    index:   true,
  },

  reviewComment: { type: String, trim: true },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  "Researcher",  // reviewer/admin who reviewed
  },
  reviewedAt: { type: Date },

  /* ── Resubmissions after rejection ── */
  resubmissionCount: { 
    type: Number, 
    default: 0,
    min: 0,
  },

  /* ── Public stats ── */
  downloads:  { 
    type: Number, 
    default: 0,
    min: 0,
  },
  views:      { 
    type: Number, 
    default: 0,
    min: 0,
  },

  isPublished: { 
    type: Boolean, 
    default: false,
    index: true,
  },

  createdAt:   { type: Date, default: Date.now, index: true },
  updatedAt:   { type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
});

/* ── Indexes for queries ── */
researchSchema.index({ researcher: 1, createdAt: -1 });
researchSchema.index({ stage: 1, status: 1 });
researchSchema.index({ isPublished: 1, createdAt: -1 });
researchSchema.index({ discipline: 1, isPublished: 1 });
researchSchema.index(
  { title: "text", abstract: "text", discipline: "text", keywords: "text" },
  { name: "research_text_search", weights: { title: 10, abstract: 5, discipline: 3 } }
);

/* ── Virtual: Total revenue from this research ── */
researchSchema.virtual("totalRevenue").get(function () {
  // This will be populated by the revenue API
  return 0;
});

/* ── Auto-publish when final paper is approved ── */
researchSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "approved" &&
    this.stage === "final_paper"
  ) {
    this.isPublished = true;
  }
  next();
});

/* ── Auto-update timestamp ── */
researchSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

/* ── Helper method: Check if ready for final paper submission ── */
researchSchema.methods.canSubmitFinalPaper = function () {
  return this.stage === "proposal" && this.status === "approved";
};

/* ── Helper method: Get payment status ── */
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