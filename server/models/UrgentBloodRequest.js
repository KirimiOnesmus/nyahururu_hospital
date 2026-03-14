const mongoose = require('mongoose');

const urgentBloodRequestSchema = new mongoose.Schema(
  {
    bloodGroups: {
      type: [String],
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
urgentBloodRequestSchema.index({ isActive: 1 });
urgentBloodRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('UrgentBloodRequest', urgentBloodRequestSchema);