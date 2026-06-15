const researchService = require("../services/researchService");

const { asyncHandler, sendSuccess } = require("../utils/appError");

//Public

exports.getPublishedResearch = asyncHandler(async (req, res) => {
  const result = await researchService.getPublishedResearch(req.query);
  sendSuccess(
    res,
    200,
    " Published research fetched successfully.",
    result.papers,
    {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  );
});

exports.getPublishedPaperById = asyncHandler(async (req, res) => {
  const paper = await researchService.getPublishedPaperById(req.params.id);
  sendSuccess(res, 200, "Research paper fetched successfully.", { paper });
});

exports.getResearchById = asyncHandler(async (req, res) => {
  const paper = await researchService.getResearchById(req.params.id);
  sendSuccess(res, 200, "Research fetched successfully.", { paper });
});

//RESEARCHER

exports.getMyResearch = asyncHandler(async (req, res) => {
  const result = await researchService.getMyResearch(
    req.researcher._id,
    req.query,
  );
  sendSuccess(res, 200, "Your research fetched successfully.", result.papers, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

exports.initiateProposalPayment = asyncHandler(async (req, res) => {
  const result = await researchService.initiateProposalPayment({
    phone: req.body.phone,
    researcherId: req.researcher?._id || null,
  });
  sendSuccess(res, 200, result.message, result);
});

exports.confirmProposalSubmission = asyncHandler(async (req, res) => {
  // Extract uploaded file — supports both .fields() and .any() multer configurations
  const file =
    req.files?.proposalFile?.[0] ||
    req.files?.find?.((f) =>
      ["proposalFile", "proposal", "pdf"].includes(f.fieldname),
    );

  const research = await researchService.confirmProposalSubmission(
    req.researcher,
    req.body,
    file,
  );

  sendSuccess(
    res,
    201,
    "Proposal submitted successfully. Awaiting reviewer assignment.",
    {
      research: {
        id: research._id,
        title: research.title,
        stage: research.stage,
        status: research.status,
        submittedAt: research.createdAt,
      },
    },
  );
});

exports.submitFinalPaper = asyncHandler(async (req, res) => {
  const file =
    req.files?.finalPaperFile?.[0] ||
    req.files?.find?.((f) =>
      ["finalPaperFile", "paper", "pdf"].includes(f.fieldname),
    );

  const research = await researchService.submitFinalPaper(
    req.researcher,
    req.params.id,
    req.body,
    file,
  );

  sendSuccess(
    res,
    200,
    "Final paper submitted successfully. Awaiting review.",
    {
      research: {
        id: research._id,
        title: research.title,
        stage: research.stage,
        status: research.status,
      },
    },
  );
});

exports.resubmit = asyncHandler(async (req, res) => {
  const file = req.files?.find?.((f) =>
    ["proposalFile", "finalPaperFile", "paper", "pdf"].includes(f.fieldname),
  );

  const research = await researchService.resubmit(
    req.researcher,
    req.params.id,
    req.body,
    file,
  );

  sendSuccess(
    res,
    200,
    "Resubmission received. The reviewer has been notified.",
    {
      research: {
        id: research._id,
        status: research.status,
        resubmissionCount: research.resubmissionCount,
      },
    },
  );
});

exports.getMyRevenue = asyncHandler(async (req, res) => {
  const result = await researchService.getResearcherRevenue(
    req.researcher,
    req.params.id,
  );
  sendSuccess(res, 200, "Revenue data fetched successfully.", result);
});

//REVIEWER

exports.getAssignedResearch = asyncHandler(async (req, res) => {
  const result = await researchService.getAssignedResearch(
    req.researcher?._id || req.user?._id,
    req.query,
  );
  sendSuccess(
    res,
    200,
    "Assigned research fetched successfully.",
    result.papers,
    {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  );
});

exports.submitReview = asyncHandler(async (req, res) => {
  const reviewer = req.researcher; // protectReviewers already validated role
  const { review, research } = await researchService.submitReview(
    reviewer,
    req.body,
  );

  sendSuccess(res, 201, "Review submitted successfully.", {
    review: {
      id: review._id,
      decision: review.decision,
      round: review.round,
      submittedAt: review.submittedAt,
    },
    research: {
      id: research._id,
      status: research.status,
    },
  });
});

exports.getReviewHistory = asyncHandler(async (req, res) => {
  const Review = require("../models/ReviewModel");
  const reviews = await Review.getAllForResearch(req.params.researchId);
  sendSuccess(res, 200, "Review history fetched successfully.", { reviews });
});

exports.getReviewerStats = asyncHandler(async (req, res) => {
  const Review = require("../models/ReviewModel");
  const reviewerId = req.researcher?._id || req.user?._id;
  const stats = await Review.getReviewerStats(reviewerId);
  sendSuccess(res, 200, "Reviewer stats fetched successfully.", { stats });
});

//ADMIN

exports.getAllResearchAdmin = asyncHandler(async (req, res) => {
  const result = await researchService.getAllResearchAdmin(req.query);
  sendSuccess(res, 200, "All research fetched successfully.", result.papers, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

exports.assignReviewer = asyncHandler(async (req, res) => {
  const { research, reviewer } = await researchService.assignReviewer(
    req.params.id,
    req.body.email,
  );

  sendSuccess(res, 200, `${reviewer.name} assigned as reviewer successfully.`, {
    research: {
      id: research._id,
      title: research.title,
      assignedReviewer: {
        id: reviewer._id,
        name: reviewer.name,
        email: reviewer.email,
      },
    },
  });
});

exports.publishResearch = asyncHandler(async (req, res) => {
  const research = await researchService.publishResearch(req.params.id);
  sendSuccess(res, 200, "Research published successfully.", {
    research: {
      id: research._id,
      title: research.title,
      isPublished: research.isPublished,
      publishedAt: research.publishedAt,
      researchId: research.researchId,
    },
  });
});

exports.updateDownloadPrice = asyncHandler(async (req, res) => {
  const research = await researchService.updateDownloadPrice(
    req.params.id,
    req.body.downloadPrice,
  );
  sendSuccess(res, 200, "Download price updated successfully.", {
    research: {
      id: research._id,
      title: research.title,
      downloadPrice: research.downloadPrice,
    },
  });
});

exports.deleteResearch = asyncHandler(async (req, res) => {
  const deletedBy = req.researcher?._id || req.user?._id;
  await researchService.deleteResearch(req.params.id, deletedBy);
  sendSuccess(res, 200, "Research deleted successfully.");
});

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await researchService.getDashboardStats();
  sendSuccess(res, 200, "Dashboard stats fetched successfully.", { stats });
});

exports.getAllRevenue = asyncHandler(async (req, res) => {
  const result = await researchService.getAllRevenueSummary(req.query);
  sendSuccess(res, 200, "Revenue summary fetched successfully.", result);
});

exports.getResearchRevenue = asyncHandler(async (req, res) => {
  const result = await researchService.getResearchRevenueAdmin(req.params.id);
  sendSuccess(res, 200, "Research revenue fetched successfully.", result);
});
