const mongoose = require("mongoose");
const {
  PAYMENT_TYPES,
  PAYMENT_STATUSES,
} = require("../constants/researchIndex");

const paymentSchema = new mongoose.Schema(
  {
    researcher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Researcher",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(PAYMENT_TYPES),
      required: [true, "Payment type is required"],
      index: true,
    },
    research: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Research",
      index: true,
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be greater than zero"],
    },
    currency: { type: String, default: "KES" },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      index: true,
    },
    buyerEmail: { type: String, trim: true, lowercase: true, default: null },

    merchantRequestId: { type: String },
    checkoutRequestId: {
      type: String,
      unique: true,
      index: true,
    },

    mpesaReceiptNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    transactionDate: { type: String },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.PENDING,
      index: true,
    },

    resultCode: { type: String },
    resultDesc: { type: String },
    refundedAt: { type: Date },
    refundReason: { type: String },
    refundCode: { type: String },
    refundAmount: { type: Number },

    // ── Secure Download Token ─────────────────────────────────────────────

    downloadToken: { type: String, select: false, default: null },
    downloadTokenExpire: { type: Date, select: false, default: null },
    downloadedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

paymentSchema.index({ status: 1, type: 1 });
paymentSchema.index({ researcher: 1, type: 1 });
paymentSchema.index({ research: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

paymentSchema.virtual("isRevenue").get(function () {
  return this.status === PAYMENT_STATUSES.COMPLETED;
});

paymentSchema.virtual("isRefundable").get(function () {
  return this.status === PAYMENT_STATUSES.COMPLETED && !this.refundedAt;
});

paymentSchema.statics.getRevenueForResearch = async function (researchId) {
  const payments = await this.find({
    research: researchId,
    status: PAYMENT_STATUSES.COMPLETED,
  }).select("type amount");

  const proposalRevenue = payments
    .filter((p) => p.type === PAYMENT_TYPES.PROPOSAL_SUBMISSION)
    .reduce((sum, p) => sum + p.amount, 0);

  const downloadPayments = payments.filter(
    (p) => p.type === PAYMENT_TYPES.PAPER_DOWNLOAD,
  );

  return {
    proposalRevenue,
    downloadRevenue: downloadPayments.reduce((s, p) => s + p.amount, 0),
    downloadCount: downloadPayments.length,
    totalRevenue: payments.reduce((s, p) => s + p.amount, 0),
  };
};

module.exports = mongoose.model("Payment", paymentSchema);
