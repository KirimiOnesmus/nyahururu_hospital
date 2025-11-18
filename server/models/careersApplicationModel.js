const mongoose = require("mongoose");

const careerApplicationSchema = new mongoose.Schema(
  {
    careerId: { type: mongoose.Schema.Types.ObjectId, ref: "Career", required: true },
    applicantName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    resumeUrl: String,
    coverLetter: String,
    status: {
      type: String,
      enum: ["pending", "reviewed", "shortlisted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CareerApplication", careerApplicationSchema);
