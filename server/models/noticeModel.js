const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['General', 'Emergency', 'Event', 'System Update', 'Policy', 'Maintenance', 'Health Advisory'],
    },
    audience: {
      type: String,
      required: true,
      enum: ['All', 'Staff', 'Patients', 'Doctors', 'Nurses', 'Public', 'Specific Department'],
    },
    startDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      default: '00:00',
    },
    endDate: {
      type: Date,
      default: null,
    },
    endTime: {
      type: String,
      default: '23:59',
    },
    status: {
      type: String,
      enum: ['active', 'scheduled', 'expired', 'hidden'],
      default: 'active',
    },
    visible: {
      type: Boolean,
      default: true,
    },
    sendNotification: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Index for searches
noticeSchema.index({ title: 'text', content: 'text' });
noticeSchema.index({ category: 1 });
noticeSchema.index({ audience: 1 });
noticeSchema.index({ status: 1 });
noticeSchema.index({ startDate: 1 });

// Pre-save middleware to calculate status
noticeSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.visible === false) {
    this.status = 'hidden';
  } else if (this.startDate > now) {
    this.status = 'scheduled';
  } else if (this.endDate && this.endDate < now) {
    this.status = 'expired';
  } else {
    this.status = 'active';
  }
  
  next();
});

module.exports = mongoose.model('Notice', noticeSchema);