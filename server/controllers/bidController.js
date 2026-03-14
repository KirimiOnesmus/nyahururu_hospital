const Bid = require('../models/bidModel');
const Tender = require('../models/tenderModel');

// Get all bids for a tender
exports.getBidsByTender = async (req, res) => {
  try {
    const { tenderId } = req.params;

    const bids = await Bid.find({ tender: tenderId })
      .populate('vendorId', 'name email phone')
      .populate('evaluatedBy', 'name email')
      .sort({ submissionDate: -1 })
      .lean();

    const summary = {
      total: bids.length,
      submitted: bids.filter(b => b.status === 'submitted').length,
      underReview: bids.filter(b => b.status === 'under_review').length,
      shortlisted: bids.filter(b => b.status === 'shortlisted').length,
      rejected: bids.filter(b => b.status === 'rejected').length,
      awarded: bids.filter(b => b.status === 'awarded').length
    };

    res.status(200).json({
      success: true,
      data: bids,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bids',
      error: error.message
    });
  }
};

// Get single bid
exports.getBidById = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id)
      .populate('tender')
      .populate('vendorId', 'name email phone')
      .populate('evaluatedBy', 'name email');

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bid',
      error: error.message
    });
  }
};

// Create new bid (vendor submission)
exports.createBid = async (req, res) => {
  try {
    const tender = await Tender.findById(req.body.tender);

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if tender is active
    if (tender.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Tender is not accepting bids'
      });
    }

    // Check deadline
    if (new Date() > new Date(tender.submissionDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Submission deadline has passed'
      });
    }

    // Check if vendor already submitted
    const existingBid = await Bid.findOne({
      tender: req.body.tender,
      vendorId: req.user.id
    });

    if (existingBid) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a bid for this tender'
      });
    }

    const bidData = {
      ...req.body,
      vendorId: req.user.id,
      vendorName: req.user.name,
      vendorEmail: req.user.email,
      tenderNumber: tender.tenderNumber
    };

    const bid = await Bid.create(bidData);

    // Add to tender activity log
    tender.activityLog.push({
      action: 'bid_received',
      description: `Bid received from ${req.user.name}`,
      performedBy: req.user.id,
      performedByName: req.user.name
    });
    await tender.save();

    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      data: bid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting bid',
      error: error.message
    });
  }
};

// Update bid (before evaluation)
exports.updateBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Only vendor can update their own bid
    if (bid.vendorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this bid'
      });
    }

    // Can only update if not evaluated yet
    if (bid.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update bid after evaluation has started'
      });
    }

    const updatedBid = await Bid.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Bid updated successfully',
      data: updatedBid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating bid',
      error: error.message
    });
  }
};

// Update bid status (admin/evaluator)
exports.updateBidStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }

    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    bid.status = status;

    // Update tender status if needed
    const tender = await Tender.findById(bid.tender);
    if (status === 'under_review' && tender.status === 'active') {
      tender.status = 'under_evaluation';
      tender.activityLog.push({
        action: 'evaluation_started',
        description: 'Bid evaluation started',
        performedBy: req.user.id,
        performedByName: req.user.name
      });
      await tender.save();
    }

    await bid.save();

    res.status(200).json({
      success: true,
      message: 'Bid status updated successfully',
      data: bid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating bid status',
      error: error.message
    });
  }
};

// Score/Evaluate bid
exports.scoreBid = async (req, res) => {
  try {
    const { technical, financial, evaluationNotes } = req.body;

    if (technical === undefined || financial === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide technical and financial scores'
      });
    }

    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Calculate overall score (weighted average: 60% technical, 40% financial)
    const overall = (technical * 0.6) + (financial * 0.4);

    bid.score = {
      technical,
      financial,
      overall: Math.round(overall * 100) / 100
    };
    bid.evaluationNotes = evaluationNotes || '';
    bid.evaluatedBy = req.user.id;
    bid.evaluatedAt = new Date();
    bid.status = 'under_review';

    await bid.save();

    res.status(200).json({
      success: true,
      message: 'Bid scored successfully',
      data: bid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error scoring bid',
      error: error.message
    });
  }
};

// Add comment to bid
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Please provide comment text'
      });
    }

    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    bid.comments.push({
      text,
      commentedBy: req.user.id,
      commentedByName: req.user.name
    });

    await bid.save();

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: bid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// Delete bid
exports.deleteBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Only vendor can delete their own bid (if not evaluated)
    if (bid.vendorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this bid'
      });
    }

    await Bid.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Bid deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting bid',
      error: error.message
    });
  }
};

// Get bids by vendor (for vendor dashboard)
exports.getVendorBids = async (req, res) => {
  try {
    const bids = await Bid.find({ vendorId: req.user.id })
      .populate('tender', 'title tenderNumber status submissionDeadline')
      .sort({ submissionDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: bids
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor bids',
      error: error.message
    });
  }
};