const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  
  researcher: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "Researcher",
    default:  null,  // Allow null for anonymous downloads
    index:    true,
  },

  type: {
    type:     String,
    enum:     ["proposal_submission", "paper_download"],
    required: true,
    index:    true,
  },

  research: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "Research",
    index:    true,
  },

 
  amount:   { type: Number, required: true },
  currency: { type: String, default: "KES" },


  phone: { 
    type: String, 
    required: true,  
    index: true,
  },

  // From STK Push initiation
  merchantRequestId:  { type: String },
  checkoutRequestId:  { 
    type: String, 
    index: true,  
    unique: true,
  },

  
  mpesaReceiptNumber: { 
    type: String,     //  QJL6XXXXXXX
    unique: true,
    sparse: true,     // Allow multiple nulls
    index: true,
  },
  transactionDate:    { type: String },   // YYYYMMDDHHMMSS from Daraja

 
  status: {
    type:    String,
    enum:    ["pending", "completed", "failed", "cancelled", "refunded"],
    default: "pending",
    index:   true,
  },


  resultCode:    { type: Number },   // 0 = success
  resultDesc:    { type: String },

  /* ── Refund details ── */
  refundedAt:    { type: Date },
  refundCode:    { type: String }, 
  refundReason:  { type: String },  
  refundAmount:  { type: Number },     

  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});


paymentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

/* ── Index for querying completed payments ── */
paymentSchema.index({ status: 1, type: 1 });
paymentSchema.index({ researcher: 1, type: 1 });
paymentSchema.index({ research: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

/* ── Virtual field for revenue ── */
paymentSchema.virtual("isRevenue").get(function () {
  return this.status === "completed";
});

module.exports = mongoose.model("Payment", paymentSchema);