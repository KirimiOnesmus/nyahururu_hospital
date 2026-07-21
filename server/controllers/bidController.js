const Bid = require('../models/bidModel');
const Tender = require('../models/tenderModel');
const { AppError, asyncHandler, sendSuccess } = require('../utils/appError');

const isOwnerOrAdmin = (req, bid) =>
  bid.vendorId.toString() === req.user.id || ['admin', 'superadmin'].includes(req.user.role);

exports.getBidsByTender = asyncHandler(async (req, res) => {
  const { tenderId } = req.params;

  const bids = await Bid.find({ tender: tenderId })
    .populate('vendorId', 'name email phone')
    .populate('evaluatedBy', 'name email')
    .sort({ submissionDate: -1 })
    .lean();

  const summary = {
    total: bids.length,
    submitted: bids.filter((b) => b.status === 'submitted').length,
    underReview: bids.filter((b) => b.status === 'under_review').length,
    shortlisted: bids.filter((b) => b.status === 'shortlisted').length,
    rejected: bids.filter((b) => b.status === 'rejected').length,
    awarded: bids.filter((b) => b.status === 'awarded').length,
  };

  return sendSuccess(res, 200, 'Bids fetched', bids, { summary });
});

// C5: previously public — any request that could guess/enumerate a Mongo
// _id got the full bid (vendor company name/email/phone, documents). Now
// requires authentication, and only the owning vendor or an admin gets the
// full record.
exports.getBidById = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id)
    .populate('tender')
    .populate('vendorId', 'name email phone')
    .populate('evaluatedBy', 'name email');

  if (!bid) throw new AppError('Bid not found', 404);

  if (!isOwnerOrAdmin(req, bid)) {
    throw new AppError('Not authorized to view this bid', 403);
  }

  return sendSuccess(res, 200, 'Bid fetched', bid);
});

exports.createBid = asyncHandler(async (req, res) => {
  const tender = await Tender.findById(req.body.tender);
  if (!tender) throw new AppError('Tender not found', 404);

  if (tender.status !== 'active') {
    throw new AppError('Tender is not accepting bids', 400);
  }

  if (new Date() > new Date(tender.submissionDeadline)) {
    throw new AppError('Submission deadline has passed', 400);
  }

  const existingBid = await Bid.findOne({ tender: req.body.tender, vendorId: req.user.id });
  if (existingBid) {
    throw new AppError('You have already submitted a bid for this tender', 400);
  }

  const bidData = {
    ...req.body,
    vendorId: req.user.id,
    vendorName: req.user.name,
    vendorEmail: req.user.email,
    tenderNumber: tender.tenderNumber,
  };

  const bid = await Bid.create(bidData);

  tender.activityLog.push({
    action: 'bid_received',
    description: `Bid received from ${req.user.name}`,
    performedBy: req.user.id,
    performedByName: req.user.name,
  });
  await tender.save();

  return sendSuccess(res, 201, 'Bid submitted successfully', bid);
});

exports.updateBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id);
  if (!bid) throw new AppError('Bid not found', 404);

  if (bid.vendorId.toString() !== req.user.id) {
    throw new AppError('Not authorized to update this bid', 403);
  }

  if (bid.status !== 'submitted') {
    throw new AppError('Cannot update bid after evaluation has started', 400);
  }

  const updatedBid = await Bid.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return sendSuccess(res, 200, 'Bid updated successfully', updatedBid);
});

exports.updateBidStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new AppError('Please provide status', 400);

  const bid = await Bid.findById(req.params.id);
  if (!bid) throw new AppError('Bid not found', 404);

  bid.status = status;

  const tender = await Tender.findById(bid.tender);
  if (tender && status === 'under_review' && tender.status === 'active') {
    tender.status = 'under_evaluation';
    tender.activityLog.push({
      action: 'evaluation_started',
      description: 'Bid evaluation started',
      performedBy: req.user.id,
      performedByName: req.user.name,
    });
    await tender.save();
  }

  await bid.save();

  return sendSuccess(res, 200, 'Bid status updated successfully', bid);
});

exports.scoreBid = asyncHandler(async (req, res) => {
  const { technical, financial, evaluationNotes } = req.body;
  if (technical === undefined || financial === undefined) {
    throw new AppError('Please provide technical and financial scores', 400);
  }

  const bid = await Bid.findById(req.params.id);
  if (!bid) throw new AppError('Bid not found', 404);

  const overall = technical * 0.6 + financial * 0.4;

  bid.score = {
    technical,
    financial,
    overall: Math.round(overall * 100) / 100,
  };
  bid.evaluationNotes = evaluationNotes || '';
  bid.evaluatedBy = req.user.id;
  bid.evaluatedAt = new Date();
  bid.status = 'under_review';

  await bid.save();

  return sendSuccess(res, 200, 'Bid scored successfully', bid);
});

exports.addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) throw new AppError('Please provide comment text', 400);

  const bid = await Bid.findById(req.params.id);
  if (!bid) throw new AppError('Bid not found', 404);

  bid.comments.push({
    text,
    commentedBy: req.user.id,
    commentedByName: req.user.name,
  });

  await bid.save();

  return sendSuccess(res, 200, 'Comment added successfully', bid);
});

exports.deleteBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id);
  if (!bid) throw new AppError('Bid not found', 404);

  if (!isOwnerOrAdmin(req, bid)) {
    throw new AppError('Not authorized to delete this bid', 403);
  }

  await Bid.findByIdAndDelete(req.params.id);

  return sendSuccess(res, 200, 'Bid deleted successfully');
});

exports.getVendorBids = asyncHandler(async (req, res) => {
  const bids = await Bid.find({ vendorId: req.user.id })
    .populate('tender', 'title tenderNumber status submissionDeadline')
    .sort({ submissionDate: -1 })
    .lean();

  return sendSuccess(res, 200, 'Vendor bids fetched', bids);
});
