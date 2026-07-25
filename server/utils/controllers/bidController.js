"use strict";

const { Op } = require("sequelize");
const { Bid, Tender, User, sequelize } = require("../sequelize/models");
const { AppError, asyncHandler, sendSuccess } = require("../utils/appError");

// ── Helpers ─────────────────────────────────────────────────────────

const isOwnerOrAdmin = (req, bid) =>
  String(bid.vendorId) === String(req.user.id) ||
  ["admin", "superadmin"].includes(req.user.role);

const VENDOR_INCLUDE = [
  { model: User, as: "vendor",    attributes: ["id", "name", "email", "phone"] },
  { model: User, as: "evaluator", attributes: ["id", "name", "email"] },
];

// JSON columns: reassign, don't push. Same pattern used across
// notice/gallery/report cutovers.
const appendActivity = (tender, entry) => {
  tender.activityLog = [...(tender.activityLog || []), entry];
};

const buildActivityEntry = (req, action, description) => ({
  action,
  description,
  performedBy: req.user.id,
  performedByName: req.user.name,
  timestamp: new Date().toISOString(),
});

// ── Endpoints ───────────────────────────────────────────────────────

exports.getBidsByTender = asyncHandler(async (req, res) => {
  const { tenderId } = req.params;

  const bids = await Bid.findAll({
    where: { tenderId },
    include: VENDOR_INCLUDE,
    order: [["submissionDate", "DESC"]],
  });

  // Compute the summary in JS after the fetch — same as Mongoose. The
  // alternative (a separate grouped SELECT) would double the round trip
  // for no real gain since we already have the rows in memory.
  const summary = {
    total:       bids.length,
    submitted:   bids.filter((b) => b.status === "submitted").length,
    underReview: bids.filter((b) => b.status === "under_review").length,
    shortlisted: bids.filter((b) => b.status === "shortlisted").length,
    rejected:    bids.filter((b) => b.status === "rejected").length,
    awarded:     bids.filter((b) => b.status === "awarded").length,
  };

  return sendSuccess(res, 200, "Bids fetched", bids, { summary });
});

// C5 preserved: this endpoint requires auth (route-level middleware) and
// only the owning vendor or an admin gets the full record — same
// isOwnerOrAdmin gate as before.
exports.getBidById = asyncHandler(async (req, res) => {
  const bid = await Bid.findByPk(req.params.id, {
    include: [{ model: Tender, as: "tender" }, ...VENDOR_INCLUDE],
  });
  if (!bid) throw new AppError("Bid not found", 404);

  if (!isOwnerOrAdmin(req, bid)) {
    throw new AppError("Not authorized to view this bid", 403);
  }

  return sendSuccess(res, 200, "Bid fetched", bid);
});

exports.createBid = asyncHandler(async (req, res) => {
  // Wrap the whole "check tender + create bid + log activity" in a
  // transaction. The Mongoose version had a race: two concurrent
  // requests from the same vendor could both pass the "no existing bid"
  // check and both insert, leaving duplicate bids. Row locks via
  // FOR UPDATE on the tender prevent that.
  const bid = await sequelize.transaction(async (t) => {
    // The client sends the tender ID as req.body.tender (Mongoose-side
    // field name). Accept both aliases so a frontend that already
    // migrated to req.body.tenderId also works.
    const tenderIdInput = req.body.tenderId ?? req.body.tender;
    if (!tenderIdInput) throw new AppError("Please provide tender ID", 400);

    const tender = await Tender.findByPk(tenderIdInput, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!tender) throw new AppError("Tender not found", 404);

    if (tender.status !== "active") {
      throw new AppError("Tender is not accepting bids", 400);
    }
    if (new Date() > new Date(tender.submissionDeadline)) {
      throw new AppError("Submission deadline has passed", 400);
    }

    const existingBid = await Bid.findOne({
      where: { tenderId: tender.id, vendorId: req.user.id },
      transaction: t,
    });
    if (existingBid) {
      throw new AppError("You have already submitted a bid for this tender", 400);
    }

    // Strip identity/auth fields off the payload — vendor identity comes
    // from the authenticated session, not the client body.
    // eslint-disable-next-line no-unused-vars
    const { tender: _t, tenderId: _tid, vendorId: _vid, vendorName: _vn, vendorEmail: _ve, ...safeBody } = req.body;

    const b = await Bid.create(
      {
        ...safeBody,
        tenderId: tender.id,
        vendorId: req.user.id,
        vendorName: req.user.name,
        vendorEmail: req.user.email,
        tenderNumber: tender.tenderNumber,
      },
      { transaction: t },
    );

    appendActivity(
      tender,
      buildActivityEntry(req, "bid_received", `Bid received from ${req.user.name}`),
    );
    await tender.save({ transaction: t });

    return b;
  });

  return sendSuccess(res, 201, "Bid submitted successfully", bid);
});

exports.updateBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findByPk(req.params.id);
  if (!bid) throw new AppError("Bid not found", 404);

  if (String(bid.vendorId) !== String(req.user.id)) {
    throw new AppError("Not authorized to update this bid", 403);
  }

  if (bid.status !== "submitted") {
    throw new AppError("Cannot update bid after evaluation has started", 400);
  }

  // Strip fields the vendor should never be able to overwrite via edit.
  // eslint-disable-next-line no-unused-vars
  const {
    id: _id, tenderId: _tid, tender: _t, vendorId: _vid, vendorName: _vn,
    vendorEmail: _ve, tenderNumber: _tn, status: _s, score: _score,
    scoreTechnical: _st, scoreFinancial: _sf, scoreCompliance: _sc,
    scoreExperience: _se, scoreOverall: _so, evaluatedBy: _eb, evaluatedAt: _ea,
    ...safeBody
  } = req.body;

  bid.set(safeBody);
  await bid.save();

  return sendSuccess(res, 200, "Bid updated successfully", bid);
});

exports.updateBidStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new AppError("Please provide status", 400);

  // Coupled state change: setting a bid to under_review flips the
  // parent tender to under_evaluation. Wrap both in one transaction so
  // partial writes are impossible.
  const bid = await sequelize.transaction(async (t) => {
    const b = await Bid.findByPk(req.params.id, { transaction: t });
    if (!b) return { notFound: true };

    b.status = status;

    if (status === "under_review") {
      const tender = await Tender.findByPk(b.tenderId, { transaction: t });
      if (tender && tender.status === "active") {
        tender.status = "under_evaluation";
        appendActivity(
          tender,
          buildActivityEntry(req, "evaluation_started", "Bid evaluation started"),
        );
        await tender.save({ transaction: t });
      }
    }

    await b.save({ transaction: t });
    return { bid: b };
  });

  if (bid.notFound) throw new AppError("Bid not found", 404);

  return sendSuccess(res, 200, "Bid status updated successfully", bid.bid);
});

exports.scoreBid = asyncHandler(async (req, res) => {
  const { technical, financial, compliance, experience, evaluationNotes } = req.body;
  if (technical === undefined || financial === undefined) {
    throw new AppError("Please provide technical and financial scores", 400);
  }

  const bid = await Bid.findByPk(req.params.id);
  if (!bid) throw new AppError("Bid not found", 404);

  // CUTOVER NOTE: the Mongoose version stored score as a subdocument
  // { technical, financial, overall } and computed overall as
  // technical*0.6 + financial*0.4. My Bid model flattened those into
  // real columns (score_technical/financial/compliance/experience/overall,
  // DECIMAL for indexable ranking) and the beforeSave hook re-derives
  // scoreOverall from a 4-component weighted formula
  // (0.4/0.3/0.2/0.1 — see SCORE_WEIGHTS in sequelize/models/bid.js).
  //
  // What this means on the wire: if the frontend still sends only
  // technical + financial, compliance and experience default to 0 and
  // overall = 0.4*t + 0.3*f — LOWER numerically than the old
  // 0.6*t + 0.4*f, but the RANKING between bids is preserved as long
  // as the same score components are populated across all bids.
  //
  // To restore the exact old overall values, submit compliance +
  // experience alongside technical + financial (the model now
  // supports all four).
  bid.scoreTechnical  = technical;
  bid.scoreFinancial  = financial;
  if (compliance !== undefined) bid.scoreCompliance = compliance;
  if (experience !== undefined) bid.scoreExperience = experience;
  bid.evaluationNotes = evaluationNotes || "";
  bid.evaluatedBy     = req.user.id;
  bid.evaluatedAt     = new Date();
  bid.status          = "under_review";

  // save() triggers the beforeSave hook which recomputes scoreOverall.
  await bid.save();

  return sendSuccess(res, 200, "Bid scored successfully", bid);
});

exports.addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) throw new AppError("Please provide comment text", 400);

  const bid = await Bid.findByPk(req.params.id);
  if (!bid) throw new AppError("Bid not found", 404);

  // Reassignment, not push — JSON change tracker.
  bid.comments = [
    ...(bid.comments || []),
    {
      text,
      commentedBy: req.user.id,
      commentedByName: req.user.name,
      commentedAt: new Date().toISOString(),
    },
  ];

  await bid.save();

  return sendSuccess(res, 200, "Comment added successfully", bid);
});

exports.deleteBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findByPk(req.params.id);
  if (!bid) throw new AppError("Bid not found", 404);

  if (!isOwnerOrAdmin(req, bid)) {
    throw new AppError("Not authorized to delete this bid", 403);
  }

  await bid.destroy();

  return sendSuccess(res, 200, "Bid deleted successfully");
});

exports.getVendorBids = asyncHandler(async (req, res) => {
  const bids = await Bid.findAll({
    where: { vendorId: req.user.id },
    include: [
      {
        model: Tender, as: "tender",
        attributes: ["id", "title", "tenderNumber", "status", "submissionDeadline"],
      },
    ],
    order: [["submissionDate", "DESC"]],
  });

  return sendSuccess(res, 200, "Vendor bids fetched", bids);
});
