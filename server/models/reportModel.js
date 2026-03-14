const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['operations', 'financial', 'inventory', 'logistics', 'hr', 'procurement'],
      required: [true, 'Report category is required'],
    },
    type: {
      type: String,
      enum: ['pdf', 'excel', 'word', 'zip', 'image'],
      required: true,
    },
    period: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Yearly', 'Custom'],
      required: true,
    },
    customStartDate: {
      type: Date,
    },
    customEndDate: {
      type: Date,
    },
    description: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number, // in bytes
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    tags: [String],
    comments: [
      {
        text: String,
        commentedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        commentedByName: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Index for search
reportSchema.index({ title: 'text', description: 'text' });
reportSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Report', reportSchema);
