const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      // in bytes
    },
    mimeType: {
      type: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    visible: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for searches
gallerySchema.index({ title: 'text', description: 'text', tags: 'text' });
gallerySchema.index({ category: 1 });
gallerySchema.index({ type: 1 });
gallerySchema.index({ visible: 1 });
gallerySchema.index({ uploadDate: -1 });

module.exports = mongoose.model('Gallery', gallerySchema);