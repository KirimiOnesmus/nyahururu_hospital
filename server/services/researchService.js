const Research   = require("../models/ResearchModel");
const Researcher = require("../models/ResearcherModel");
const Payment    = require("../models/PaymentModel");
const Review     = require("../models/ReviewModel");
const mpesa      = require("../utils/mpesaService");
const email      = require("../utils/emailServices");
const { AppError } = require("../utils/appError");
const {
  RESEARCH_STAGES,
  RESEARCH_STATUSES,
  PAYMENT_TYPES,
  PAYMENT_STATUSES,
  REVIEW_DECISIONS,
  RESEARCHER_ROLES,
  FEES,
  PAGINATION,
} = require("../constants/researchIndex");

const getPublishedResearch = async (query) => {
  const {
    page       = PAGINATION.DEFAULT_PAGE,
    limit      = PAGINATION.DEFAULT_LIMIT,
    search,
    discipline,
    sort       = "newest",
    priceMin,
    priceMax,
  } = query;

  const safeLimit = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const safePage  = Math.max(1, Number(page));

  const filter = { isPublished: true };
  if (discipline) filter.discipline = { $regex: discipline, $options: "i" };
  if (priceMin !== undefined) filter.downloadPrice = { $gte: Number(priceMin) };
  if (priceMax !== undefined) {
    filter.downloadPrice = { ...(filter.downloadPrice || {}), $lte: Number(priceMax) };
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const sortMap = {
    newest:    { createdAt: -1 },
    oldest:    { createdAt:  1 },
    downloads: { downloads: -1 },
    price:     { downloadPrice: 1 },
  };

  const [papers, total] = await Promise.all([
    Research.find(filter)
      .select("title discipline finalAbstract abstract researcher keywords downloads views downloadPrice publishedAt researchId")
      .populate("researcher", "name institution")
      .sort(sortMap[sort] || sortMap.newest)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Research.countDocuments(filter),
  ]);

  return {
    total,
    page:       safePage,
    limit:      safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    papers,
  };
};

//PUBLIC

const getPublishedPaperById = async (id) => {
  const paper = await Research.findOne({ _id: id, isPublished: true })
    .select("-proposalFile -proposalFileKey -finalPaperFile -finalPaperFileKey")
    .populate("researcher", "name institution bio socialLinks")
    .lean();

  if (!paper) throw new AppError("Research paper not found.", 404);

  // Increment view count — atomic, no race condition
  await Research.findByIdAndUpdate(id, { $inc: { views: 1 } });

  return paper;
};

const getResearchById = async (id) => {
  const paper = await Research.findById(id)
    .populate("researcher", "name institution bio socialLinks")
    .populate("assignedReviewer", "name firstName lastName email institution")
    .populate("reviewedBy", "name");

  if (!paper) throw new AppError("Research not found.", 404);
  return paper;
};

//RESEARCHER

const getMyResearch = async (researcherId, { page, limit }) => {
  const safePage  = Math.max(1, Number(page)  || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  const [papers, total] = await Promise.all([
    Research.find({ researcher: researcherId })
      .select("title discipline stage status isPublished downloads downloadPrice reviewComment createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Research.countDocuments({ researcher: researcherId }),
  ]);

  return {
    total,
    page:       safePage,
    limit:      safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    papers,
  };
};

//  RESEARCHER — Initiate proposal payment (STK Push)

const initiateProposalPayment = async ({ phone, researcherId }) => {
  const amount     = FEES.PROPOSAL_SUBMISSION;
  const accountRef = "Proposal";
  const description = "Research proposal submission fee";

  const stkResult = await mpesa.initiateSTKPush({ phone, amount, accountRef, description });

  if (stkResult.ResponseCode !== "0") {
    throw new AppError(
      stkResult.ResponseDescription || "Payment initiation failed. Please try again.",
      502
    );
  }

  const payment = await Payment.create({
    researcher:        researcherId,
    type:              PAYMENT_TYPES.PROPOSAL_SUBMISSION,
    amount,
    phone,
    merchantRequestId: stkResult.MerchantRequestID,
    checkoutRequestId: stkResult.CheckoutRequestID,
    status:            PAYMENT_STATUSES.PENDING,
  });

  return {
    message:          stkResult.CustomerMessage || "STK Push sent. Enter your M-Pesa PIN.",
    checkoutRequestId: stkResult.CheckoutRequestID,
    paymentId:         payment._id,
    amount,
  };
};

//  RESEARCHER — Confirm proposal
const confirmProposalSubmission = async (researcher, body, file) => {
  const {
    paymentId, title, discipline, abstract, background,
    objectives, methodology, expectedOutcome, timeline, teamMembers, references,
  } = body;

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new AppError("Payment record not found.", 404);

  if (payment.status !== PAYMENT_STATUSES.COMPLETED) {
    throw new AppError(
      `Payment is ${payment.status}. Please complete the M-Pesa payment before submitting.`,
      400
    );
  }

  // Link payment to this researcher if anonymous
  if (!payment.researcher) {
    payment.researcher = researcher._id;
    await payment.save();
  }

  const proposalFile    = file ? `/uploads/research/${file.filename}` : null;
  const proposalFileKey = file?.key || null; // Cloudinary/S3 key

  const newResearch = await Research.create({
    title,
    discipline,
    abstract,
    background,
    objectives,
    methodology,
    expectedOutcome,
    timeline,
    teamMembers,
    references,
    proposalFile,
    proposalFileKey,
    researcher:        researcher._id,
    stage:             RESEARCH_STAGES.PROPOSAL,
    status:            RESEARCH_STATUSES.PENDING,
    submissionPayment: payment._id,
    isPublished:       false,
    downloadPrice:     FEES.DEFAULT_DOWNLOAD,
  });

  payment.research = newResearch._id;
  await payment.save();

  await email.sendProposalSubmitted({
    email:         researcher.email,
    name:          researcher.name || researcher.firstName,
    proposalTitle: newResearch.title,
    mpesaReceipt:  payment.mpesaReceiptNumber,
    amount:        payment.amount,
  });

  return newResearch;
};

//RESEARCHER — Submit final paper
const submitFinalPaper = async (researcher, researchId, body, file) => {
  const { finalAbstract, keywords } = body;

  const research = await Research.findOne({
    _id:        researchId,
    researcher: researcher._id,
  });

  if (!research) {
    throw new AppError("Research not found or does not belong to you.", 404);
  }

  if (research.stage !== RESEARCH_STAGES.PROPOSAL) {
    throw new AppError(
      `Cannot submit final paper — current stage is '${research.stage}'.`,
      400
    );
  }

  if (research.status !== RESEARCH_STATUSES.APPROVED) {
    throw new AppError(
      "Your proposal must be approved before submitting the final paper.",
      400
    );
  }

  if (!file) {
    throw new AppError("Final paper PDF file is required.", 400);
  }

  research.finalAbstract    = finalAbstract || research.abstract;
  research.keywords         = Array.isArray(keywords) ? keywords : (keywords || "").split(",").map((k) => k.trim()).filter(Boolean);
  research.finalPaperFile   = `/uploads/research/${file.filename}`;
  research.finalPaperFileKey = file.key || null;
  research.stage            = RESEARCH_STAGES.FINAL_PAPER;
  research.status           = RESEARCH_STATUSES.PENDING;
  await research.save();

 
  await email.sendFinalPaperSubmitted({ 
    email:         researcher.email,
    name:          researcher.name || researcher.firstName,
    proposalTitle: research.title,
  });


  if (research.assignedReviewer) {
    const reviewer = await Researcher.findById(research.assignedReviewer)
      .select("email name firstName");
    if (reviewer) {
      await email.sendNewProposalToReview({
        email:          reviewer.email,
        name:           reviewer.firstName || reviewer.name,
        proposalTitle:  research.title,
        researcherName: researcher.name || researcher.firstName,
        stage:          RESEARCH_STAGES.FINAL_PAPER,
        discipline:     research.discipline,
        reviewLink:     `${process.env.FRONTEND_URL}/hmis`,
      });
    }
  }

  return research;
};

//  RESEARCHER — Resubmit after revision request (free)

const resubmit = async (researcher, researchId, body, file) => {
  const research = await Research.findOne({
    _id:        researchId,
    researcher: researcher._id,
  });

  if (!research) throw new AppError("Research not found.", 404);

  if (research.status !== RESEARCH_STATUSES.REJECTED) {

    const latestReview = await Review.findOne({
      research: researchId,
      isLatest: true,
    });

    if (!latestReview || latestReview.decision !== REVIEW_DECISIONS.REVISION) {
      throw new AppError(
        "Resubmission is only allowed when a revision has been requested.",
        400
      );
    }
  }


  const ALLOWED = ["abstract", "background", "objectives", "methodology", "expectedOutcome", "timeline", "finalAbstract", "keywords"];
  ALLOWED.forEach((f) => {
    if (body[f] !== undefined) research[f] = body[f];
  });

  if (file) {
    const fileField    = research.stage === RESEARCH_STAGES.FINAL_PAPER ? "finalPaperFile"    : "proposalFile";
    const fileKeyField = research.stage === RESEARCH_STAGES.FINAL_PAPER ? "finalPaperFileKey" : "proposalFileKey";
    research[fileField]    = `/uploads/research/${file.filename}`;
    research[fileKeyField] = file.key || null;
  }

  research.status            = RESEARCH_STATUSES.PENDING;
  research.resubmissionCount = (research.resubmissionCount || 0) + 1;
  await research.save();


  if (research.assignedReviewer) {
    const reviewer = await Researcher.findById(research.assignedReviewer).select("email name firstName");
    if (reviewer) {
      await email.sendResubmissionNotice({
        email:          reviewer.email,
        reviewerName:   reviewer.name || reviewer.firstName,
        proposalTitle:  research.title,
        researcherName: researcher.name || researcher.firstName,
        reviewLink:     `${process.env.FRONTEND_URL}/hmis`,
      });
    }
  }

  return research;
};

//  REVIEWER — Get assigned submissions

const getAssignedResearch = async (reviewerId, { page, limit }) => {
  const safePage  = Math.max(1, Number(page)  || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  const [papers, total] = await Promise.all([
    Research.find({ assignedReviewer: reviewerId, status: RESEARCH_STATUSES.PENDING })
      .select("title discipline stage status resubmissionCount assignedAt createdAt")
      .populate("researcher", "name institution")
      .sort({ assignedAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Research.countDocuments({ assignedReviewer: reviewerId, status: RESEARCH_STATUSES.PENDING }),
  ]);

  return { total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit), papers };
};

//  REVIEWER — Submit review

const submitReview = async (reviewer, { researchId, stage, decision, comment, criteria }) => {
  const research = await Research.findById(researchId)
    .populate("researcher", "email name firstName");

  if (!research) throw new AppError("Research not found.", 404);

  if (research.assignedReviewer?.toString() !== reviewer._id.toString()) {
    throw new AppError("You are not the assigned reviewer for this research.", 403);
  }

  if (research.status !== RESEARCH_STATUSES.PENDING) {
    throw new AppError(`Cannot review — current status is '${research.status}'.`, 400);
  }

  const latestReview = await Review.findOne({ research: researchId, stage, isLatest: true });
  const round        = latestReview ? latestReview.round + 1 : 1;


  const review = await Review.create({
    research:   researchId,
    reviewer:   reviewer._id,
    stage,
    round,
    decision,
    comment,
    criteria:   criteria || {},
    isLatest:   true,
    submittedAt: new Date(),
  });


  const statusMap = {
    [REVIEW_DECISIONS.APPROVED]: RESEARCH_STATUSES.APPROVED,
    [REVIEW_DECISIONS.REVISION]: RESEARCH_STATUSES.REJECTED, 
    [REVIEW_DECISIONS.REJECTED]: RESEARCH_STATUSES.REJECTED,
  };


  research.status       = statusMap[decision];
  research.reviewComment = comment;
  research.reviewedBy   = reviewer._id;
  research.reviewedAt   = new Date();

 
  if (
    decision === REVIEW_DECISIONS.APPROVED &&
    stage    === RESEARCH_STAGES.PROPOSAL   &&
    !research.researchId
  ) {
    research.researchId = await Research.generateResearchId();
  }

  await research.save();


  const stats = await Review.getReviewerStats(reviewer._id);
  await Researcher.findByIdAndUpdate(reviewer._id, {
    $inc:  { reviewCount: 1 },
    $set:  { acceptanceRate: stats.acceptanceRate },
  });


  const researcherDoc = research.researcher;
  const emailData     = {
    email:          researcherDoc.email,
    name:           researcherDoc.name || researcherDoc.firstName,
    proposalTitle:  research.title,
    stage,
    reviewerComment: comment,
  };

  if (decision === REVIEW_DECISIONS.APPROVED) {
    await email.sendProposalApproved(emailData);
  } else if (decision === REVIEW_DECISIONS.REVISION) {
    await email.sendRevisionRequested(emailData);
  } else {
    await email.sendProposalRejected(emailData);
  }

  return { review, research };
};

//  ADMIN — Get all research

const getAllResearchAdmin = async ({ stage, status, search, page, limit }) => {
  const safePage  = Math.max(1, Number(page)  || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(Number(limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

  const filter = {};
  if (stage)  filter.stage  = stage;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title:    { $regex: search, $options: "i" } },
      { abstract: { $regex: search, $options: "i" } },
    ];
  }

  const [papers, total] = await Promise.all([
    Research.find(filter)
      .select("title discipline stage status isPublished researcher assignedReviewer reviewComment downloadPrice downloads researchId createdAt updatedAt")
      .populate("researcher",        "name institution email")
      .populate("assignedReviewer",  "name email institution")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Research.countDocuments(filter),
  ]);

  return { total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit), papers };
};

//  ADMIN — Assign reviewer

const assignReviewer = async (researchId, reviewerEmail) => {
  const research = await Research.findById(researchId);
  if (!research) throw new AppError("Research not found.", 404);

  const reviewer = await Researcher.findOne({
    email: reviewerEmail.toLowerCase().trim(),
    role:  { $in: [RESEARCHER_ROLES.REVIEWER, RESEARCHER_ROLES.ADMIN, RESEARCHER_ROLES.SUPERADMIN] },
  });

  if (!reviewer) {
    throw new AppError("No active reviewer or admin found with that email.", 404);
  }

  research.assignedReviewer = reviewer._id;
  research.assignedAt       = new Date();
  await research.save();

  const researcherDoc = await Researcher.findById(research.researcher).select("name firstName");

  await email.sendNewProposalToReview({
    email:          reviewer.email,
    name:           reviewer.firstName || reviewer.name,
    proposalTitle:  research.title,
    researcherName: researcherDoc?.name || "Researcher",
    stage:          research.stage,
    discipline:     research.discipline,
    reviewLink:     `${process.env.FRONTEND_URL}/hmis`,
  });

  return { research, reviewer };
};

//  ADMIN — Publish research

const publishResearch = async (researchId) => {
  const research = await Research.findById(researchId);
  if (!research) throw new AppError("Research not found.", 404);

  if (research.isPublished) {
    throw new AppError("This research is already published.", 400);
  }
  if (research.stage !== RESEARCH_STAGES.FINAL_PAPER) {
    throw new AppError(
      `Only final papers can be published. Current stage: '${research.stage}'.`,
      400
    );
  }
  if (research.status !== RESEARCH_STATUSES.APPROVED) {
    throw new AppError("Research must be approved before publishing.", 400);
  }

  research.isPublished = true;
  research.publishedAt = new Date();
  await research.save();

  const researcherDoc = await Researcher.findById(research.researcher)
    .select("email name firstName");

  if (researcherDoc) {
    await email.sendProposalApproved({
      email:          researcherDoc.email,
      name:           researcherDoc.firstName || researcherDoc.name,
      proposalTitle:  research.title,
      stage:          RESEARCH_STAGES.FINAL_PAPER,
      reviewerComment:"Congratulations! Your paper has been published on the Nyahururu Research Portal.",
    });
  }

  return research;
};

//  ADMIN — Update download price
const updateDownloadPrice = async (researchId, downloadPrice) => {
  const research = await Research.findByIdAndUpdate(
    researchId,
    { downloadPrice },
    { new: true, runValidators: true }
  );
  if (!research) throw new AppError("Research not found.", 404);
  return research;
};

//  ADMIN — Soft delete

const deleteResearch = async (researchId, deletedBy) => {
  const research = await Research.findById(researchId).setOptions({ includeDeleted: false });
  if (!research) throw new AppError("Research not found.", 404);

  await research.softDelete(deletedBy);
};

//  RESEARCHER — Get own revenue

const getResearcherRevenue = async (researcher, researchId) => {
  const research = await Research.findOne({
    _id:        researchId,
    researcher: researcher._id,
  });
  if (!research) throw new AppError("Research not found or does not belong to you.", 404);

  const revenueData = await Payment.getRevenueForResearch(researchId);

  return {
    research: {
      id:            research._id,
      title:         research.title,
      downloads:     research.downloads,
      downloadPrice: research.downloadPrice,
      isPublished:   research.isPublished,
    },
    revenue: revenueData,
  };
};

//  ADMIN — Get revenue for any research

const getResearchRevenueAdmin = async (researchId) => {
  const research = await Research.findById(researchId)
    .populate("researcher", "name email");
  if (!research) throw new AppError("Research not found.", 404);

  const revenueData = await Payment.getRevenueForResearch(researchId);

  const recentPayments = await Payment.find({
    research: researchId,
    status:   PAYMENT_STATUSES.COMPLETED,
  })
    .select("type amount createdAt mpesaReceiptNumber")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return {
    researchId,
    title: research.title,
    researcher: {
      id:    research.researcher._id,
      name:  research.researcher.name,
      email: research.researcher.email,
    },
    revenue:        revenueData,
    downloadCount:  research.downloads,
    recentPayments,
  };
};

//  ADMIN — Portal-wide revenue summary

const getAllRevenueSummary = async ({ researcherId, status = PAYMENT_STATUSES.COMPLETED }) => {
  const filter = { status };
  if (researcherId) filter.researcher = researcherId;

  const payments = await Payment.find(filter)
    .populate("research", "title")
    .populate("researcher", "name email")
    .lean();

  const byResearch = {};
  let totalRevenue = 0;

  payments.forEach((p) => {
    if (!p.research) return;
    const key = p.research._id.toString();
    if (!byResearch[key]) {
      byResearch[key] = {
        researchId:      p.research._id,
        title:           p.research.title,
        proposalRevenue: 0,
        downloadRevenue: 0,
        totalRevenue:    0,
        downloadCount:   0,
      };
    }
    if (p.type === PAYMENT_TYPES.PROPOSAL_SUBMISSION) {
      byResearch[key].proposalRevenue += p.amount;
    } else if (p.type === PAYMENT_TYPES.PAPER_DOWNLOAD) {
      byResearch[key].downloadRevenue += p.amount;
      byResearch[key].downloadCount   += 1;
    }
    byResearch[key].totalRevenue += p.amount;
    totalRevenue                 += p.amount;
  });

  const sorted = Object.values(byResearch).sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    summary: {
      totalRevenue,
      totalPayments:       payments.length,
      proposalSubmissions: payments.filter((p) => p.type === PAYMENT_TYPES.PROPOSAL_SUBMISSION).length,
      paperDownloads:      payments.filter((p) => p.type === PAYMENT_TYPES.PAPER_DOWNLOAD).length,
      totalResearch:       sorted.length,
    },
    byResearch: sorted,
  };
};

//  ADMIN — Dashboard stats

const getDashboardStats = async () => {
  const [
    totalResearch,
    pendingProposals,
    approvedProposals,
    publishedPapers,
    pendingFinalPapers,
    unassigned,
    totalResearchers,
    totalReviewers,
  ] = await Promise.all([
    Research.countDocuments({}),
    Research.countDocuments({ stage: RESEARCH_STAGES.PROPOSAL,    status: RESEARCH_STATUSES.PENDING   }),
    Research.countDocuments({ stage: RESEARCH_STAGES.PROPOSAL,    status: RESEARCH_STATUSES.APPROVED  }),
    Research.countDocuments({ isPublished: true }),
    Research.countDocuments({ stage: RESEARCH_STAGES.FINAL_PAPER, status: RESEARCH_STATUSES.PENDING   }),
    Research.countDocuments({ assignedReviewer: null,              status: RESEARCH_STATUSES.PENDING   }),
    Researcher.countDocuments({ role: RESEARCHER_ROLES.RESEARCHER }),
    Researcher.countDocuments({ role: RESEARCHER_ROLES.REVIEWER   }),
  ]);

  return {
    research: {
      total: totalResearch,
      pendingProposals,
      approvedProposals,
      pendingFinalPapers,
      published: publishedPapers,
      unassigned,
    },
    users: { totalResearchers, totalReviewers },
  };
};


module.exports = {
  getPublishedResearch,
  getPublishedPaperById,
  getResearchById,
  getMyResearch,
  initiateProposalPayment,
  confirmProposalSubmission,
  submitFinalPaper,
  resubmit,
  getAssignedResearch,
  submitReview,
  getAllResearchAdmin,
  assignReviewer,
  publishResearch,
  updateDownloadPrice,
  deleteResearch,
  getResearcherRevenue,
  getResearchRevenueAdmin,
  getAllRevenueSummary,
  getDashboardStats,
};