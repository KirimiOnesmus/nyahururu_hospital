// models/Tender.js
const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema({
  tenderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Medical Equipment',
      'Drugs & Pharmaceuticals',
      'ICT Services',
      'Construction',
      'Maintenance',
      'Consultancy',
      'Laboratory Supplies',
      'Food Services',
      'Other'
    ]
  },
  description: {
    type: String,
    required: true
  },
  scopeOfWork: {
    type: String,
    required: true
  },
  eligibilityCriteria: {
    type: String,
    default: ''
  },
  requiredDocuments: {
    type: String,
    default: ''
  },
  deliverables: {
    type: String,
    default: ''
  },
  budgetMin: {
    type: Number,
    default: 0
  },
  budgetMax: {
    type: Number,
    default: 0
  },
  budgetRange: {
    type: String,
    default: ''
  },
  publicationDate: {
    type: Date,
    required: true
  },
  submissionDeadline: {
    type: Date,
    required: true
  },
  evaluationDate: {
    type: Date
  },
  visibility: {
    type: String,
    enum: ['public', 'internal', 'restricted'],
    default: 'public'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'under_evaluation', 'awarded', 'cancelled'],
    default: 'draft'
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  bidsReceived: {
    type: Number,
    default: 0
  },
  awardedTo: {
    type: String,
    default: null
  },
  awardedBidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  activityLog: [{
    action: String,
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Virtual for formatted budget range
tenderSchema.virtual('formattedBudgetRange').get(function() {
  if (this.budgetMin && this.budgetMax) {
    return `$${this.budgetMin.toLocaleString()} - $${this.budgetMax.toLocaleString()}`;
  }
  return 'Not specified';
});

// Pre-save middleware to generate tender number
tenderSchema.pre('save', async function(next) {
  if (!this.tenderNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Tender').countDocuments();
    this.tenderNumber = `TND-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  
  // Set budget range string
  if (this.budgetMin && this.budgetMax) {
    this.budgetRange = `$${this.budgetMin.toLocaleString()} - $${this.budgetMax.toLocaleString()}`;
  }
  
  next();
});

// Index for searching
tenderSchema.index({ title: 'text', description: 'text', tenderNumber: 'text' });
tenderSchema.index({ status: 1, category: 1 });
tenderSchema.index({ submissionDeadline: 1 });

module.exports = mongoose.model('Tender', tenderSchema);