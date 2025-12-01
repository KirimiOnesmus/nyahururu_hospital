// models/Bid.js
const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  tender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tender',
    required: [true, 'Tender reference is required'],
    index: true
  },
  tenderNumber: {
    type: String,
    required: [true, 'Tender number is required'],
    trim: true
  },
  
  // Vendor Information
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vendor ID is required'],
    index: true
  },
  vendorName: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true
  },
  vendorEmail: {
    type: String,
    required: [true, 'Vendor email is required'],
    lowercase: true,
    trim: true
  },
  vendorPhone: {
    type: String,
    trim: true
  },
  vendorCompany: {
    type: String,
    trim: true
  },
  vendorAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Financial Information
  bidAmount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0, 'Bid amount cannot be negative']
  },
  formattedBidAmount: {
    type: String
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'KES', 'UGX']
  },
  paymentTerms: {
    type: String,
    trim: true
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Proposal Details
  technicalProposal: {
    type: String,
    required: [true, 'Technical proposal is required']
  },
  financialProposal: {
    type: String
  },
  executiveSummary: {
    type: String
  },
  methodology: {
    type: String
  },
  keyPersonnel: [{
    name: String,
    role: String,
    qualifications: String,
    experience: String
  }],
  
  // Delivery & Timeline
  deliveryTimeline: {
    type: String
  },
  startDate: {
    type: Date
  },
  completionDate: {
    type: Date
  },
  milestones: [{
    name: String,
    description: String,
    deadline: Date,
    deliverables: String
  }],
  
  // Terms & Conditions
  warrantyTerms: {
    type: String
  },
  warrantyPeriod: {
    type: Number, // in months
    min: 0
  },
  maintenanceSupport: {
    type: String
  },
  compliance: [{
    standard: String,
    certificate: String,
    expiryDate: Date
  }],
  
  // Documents & Attachments
  documents: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    category: {
      type: String,
      enum: ['technical', 'financial', 'legal', 'certificate', 'other']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Bid Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'shortlisted', 'rejected', 'awarded', 'withdrawn'],
    default: 'submitted',
    index: true
  },
  rejectionReason: {
    type: String
  },
  
  // Evaluation & Scoring
  score: {
    technical: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    financial: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    compliance: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    overall: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Detailed Evaluation Criteria
  evaluationCriteria: [{
    criterion: String,
    weight: Number,
    score: Number,
    maxScore: Number,
    comments: String
  }],
  
  evaluationNotes: {
    type: String,
    default: ''
  },
  strengths: [String],
  weaknesses: [String],
  recommendations: {
    type: String
  },
  
  // Evaluator Information
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  evaluatedByName: {
    type: String
  },
  evaluatedAt: {
    type: Date
  },
  
  // Multiple Evaluators Support
  evaluators: [{
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    evaluatorName: String,
    score: {
      technical: Number,
      financial: Number,
      compliance: Number,
      experience: Number,
      overall: Number
    },
    comments: String,
    evaluatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Dates
  submissionDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastModifiedDate: {
    type: Date
  },
  withdrawnDate: {
    type: Date
  },
  
  // Communication & Comments
  comments: [{
    text: {
      type: String,
      required: true
    },
    commentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    commentedByName: String,
    commentedByRole: String,
    isInternal: {
      type: Boolean,
      default: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Clarifications & Questions
  clarifications: [{
    question: String,
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    askedByName: String,
    askedAt: Date,
    answer: String,
    answeredAt: Date,
    status: {
      type: String,
      enum: ['pending', 'answered'],
      default: 'pending'
    }
  }],
  
  // Financial Analysis
  costBreakdown: [{
    item: String,
    description: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number,
    notes: String
  }],
  
  // Competitive Analysis
  ranking: {
    type: Number,
    min: 0
  },
  isLowestBid: {
    type: Boolean,
    default: false
  },
  priceCompetitiveness: {
    type: String,
    enum: ['highly_competitive', 'competitive', 'average', 'above_average', 'expensive']
  },
  
  // Vendor History & Performance
  vendorPastPerformance: {
    previousContracts: Number,
    successfulDeliveries: Number,
    averageRating: Number,
    hasDefaulted: Boolean
  },
  
  // Risk Assessment
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  identifiedRisks: [{
    risk: String,
    severity: String,
    mitigation: String
  }],
  
  // Metadata
  isConfidential: {
    type: Boolean,
    default: false
  },
  tags: [String],
  flags: [{
    type: {
      type: String,
      enum: ['incomplete', 'missing_docs', 'price_concern', 'quality_concern', 'compliance_issue']
    },
    description: String,
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    flaggedAt: Date,
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  
  // Activity Log
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
    },
    metadata: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days since submission
bidSchema.virtual('daysSinceSubmission').get(function() {
  if (!this.submissionDate) return 0;
  const now = new Date();
  const diffTime = Math.abs(now - this.submissionDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total cost with tax
bidSchema.virtual('totalCostWithTax').get(function() {
  if (!this.bidAmount || !this.taxRate) return this.bidAmount;
  return this.bidAmount + (this.bidAmount * this.taxRate / 100);
});

// Virtual for evaluation completion percentage
bidSchema.virtual('evaluationProgress').get(function() {
  const scores = [
    this.score.technical,
    this.score.financial,
    this.score.compliance,
    this.score.experience
  ];
  const evaluated = scores.filter(s => s > 0).length;
  return (evaluated / scores.length) * 100;
});

// Pre-save middleware to format bid amount and log activity
bidSchema.pre('save', function(next) {
  // Format bid amount
  if (this.bidAmount) {
    this.formattedBidAmount = `${this.currency} ${this.bidAmount.toLocaleString()}`;
  }
  
  // Update last modified date
  if (this.isModified() && !this.isNew) {
    this.lastModifiedDate = new Date();
  }
  
  // Calculate overall score if individual scores exist
  if (this.score.technical || this.score.financial || this.score.compliance || this.score.experience) {
    const weights = {
      technical: 0.40,
      financial: 0.30,
      compliance: 0.20,
      experience: 0.10
    };
    
    this.score.overall = (
      (this.score.technical * weights.technical) +
      (this.score.financial * weights.financial) +
      (this.score.compliance * weights.compliance) +
      (this.score.experience * weights.experience)
    );
    
    this.score.overall = Math.round(this.score.overall * 100) / 100;
  }
  
  next();
});

// Post-save middleware to update tender's bidsReceived count
bidSchema.post('save', async function(doc) {
  try {
    const Tender = mongoose.model('Tender');
    const bidCount = await mongoose.model('Bid').countDocuments({ 
      tender: doc.tender,
      status: { $nin: ['draft', 'withdrawn'] }
    });
    
    await Tender.findByIdAndUpdate(doc.tender, { 
      bidsReceived: bidCount 
    });
  } catch (error) {
    console.error('Error updating tender bid count:', error);
  }
});

// Post-remove middleware to update tender's bidsReceived count
bidSchema.post('remove', async function(doc) {
  try {
    const Tender = mongoose.model('Tender');
    const bidCount = await mongoose.model('Bid').countDocuments({ 
      tender: doc.tender,
      status: { $nin: ['draft', 'withdrawn'] }
    });
    
    await Tender.findByIdAndUpdate(doc.tender, { 
      bidsReceived: bidCount 
    });
  } catch (error) {
    console.error('Error updating tender bid count after removal:', error);
  }
});

// Static method to get bid statistics
bidSchema.statics.getBidStatistics = async function(tenderId) {
  const stats = await this.aggregate([
    { $match: { tender: mongoose.Types.ObjectId(tenderId) } },
    {
      $group: {
        _id: null,
        totalBids: { $sum: 1 },
        averageBid: { $avg: '$bidAmount' },
        lowestBid: { $min: '$bidAmount' },
        highestBid: { $max: '$bidAmount' },
        averageScore: { $avg: '$score.overall' }
      }
    }
  ]);
  
  return stats[0] || null;
};

// Instance method to add activity log entry
bidSchema.methods.addActivityLog = function(action, description, user) {
  this.activityLog.push({
    action,
    description,
    performedBy: user._id,
    performedByName: user.name
  });
  return this.save();
};

// Instance method to add comment
bidSchema.methods.addComment = function(text, user, isInternal = true) {
  this.comments.push({
    text,
    commentedBy: user._id,
    commentedByName: user.name,
    commentedByRole: user.role,
    isInternal
  });
  return this.save();
};

// Instance method to calculate financial competitiveness
bidSchema.methods.calculateCompetitiveness = async function() {
  const Bid = this.constructor;
  const allBids = await Bid.find({ 
    tender: this.tender,
    status: { $nin: ['draft', 'withdrawn', 'rejected'] }
  }).sort({ bidAmount: 1 });
  
  if (allBids.length === 0) return;
  
  const lowestBid = allBids[0].bidAmount;
  const highestBid = allBids[allBids.length - 1].bidAmount;
  const averageBid = allBids.reduce((sum, bid) => sum + bid.bidAmount, 0) / allBids.length;
  
  this.isLowestBid = this.bidAmount === lowestBid;
  this.ranking = allBids.findIndex(bid => bid._id.equals(this._id)) + 1;
  
  // Determine price competitiveness
  const percentageFromAverage = ((this.bidAmount - averageBid) / averageBid) * 100;
  
  if (percentageFromAverage <= -15) {
    this.priceCompetitiveness = 'highly_competitive';
  } else if (percentageFromAverage <= -5) {
    this.priceCompetitiveness = 'competitive';
  } else if (percentageFromAverage <= 5) {
    this.priceCompetitiveness = 'average';
  } else if (percentageFromAverage <= 15) {
    this.priceCompetitiveness = 'above_average';
  } else {
    this.priceCompetitiveness = 'expensive';
  }
  
  return this.save();
};

// Indexes for optimal querying
bidSchema.index({ tender: 1, status: 1 });
bidSchema.index({ vendorId: 1, submissionDate: -1 });
bidSchema.index({ status: 1, submissionDate: -1 });
bidSchema.index({ 'score.overall': -1 });
bidSchema.index({ bidAmount: 1 });
bidSchema.index({ ranking: 1 });
bidSchema.index({ tenderNumber: 1 });

// Compound indexes for complex queries
bidSchema.index({ tender: 1, 'score.overall': -1, bidAmount: 1 });
bidSchema.index({ status: 1, evaluatedAt: -1 });

module.exports = mongoose.model('Bid', bidSchema);