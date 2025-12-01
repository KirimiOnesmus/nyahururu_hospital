const mongoose = require('mongoose');

const fraudSchema = new mongoose.Schema(
  {
    issue: { type: String, required: true },
    dateOfIncident: { type: String },
    location: { type: String },
    details: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
    },
    investigationNotes: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedByName: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FraudReport', fraudSchema);
