const researchService = require("../services/researchService");

const { asyncHandler, sendSuccess, AppError } = require("../utils/appError");

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
  const paper = await researchService.getResearchById(req.params.id, {
    researcher: req.researcher || null,
    user: req.user || null,
  });  
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
  const findFile = (fieldname) => req.files?.find?.((f) => f.fieldname === fieldname);
 
  const file =
    req.files?.finalPaperFile?.[0] ||
    findFile("finalPaperFile") ||
    findFile("paper") ||
    findFile("pdf");

  const supportingFiles = {
    finalDataset: findFile("finalDataset"),
    dataDictionary: findFile("dataDictionary"),
    statisticalScripts: findFile("statisticalScripts"),
    ethicsApproval: findFile("ethicsApproval"),
    fundingDisclosure: findFile("fundingDisclosure"),
  };

  const research = await researchService.submitFinalPaper(
    req.researcher,
    req.params.id,
    req.body,
    file, 
    supportingFiles,
  );

  sendSuccess(res, 200, "Final paper submitted successfully. Awaiting review.", {
    research: {
      id: research._id,
      title: research.title,
      stage: research.stage,
      status: research.status,
    },
  });
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
exports.submitProgress = asyncHandler(async (req, res) => {
  const research = await researchService.submitProgress(req.researcher, req.params.id, req.body, req.files);
  sendSuccess(res, 200, "Progress report submitted successfully. Awaiting review.", {
    research: { id: research._id, stage: research.stage, status: research.status },
  });
});
 
exports.reactivateResearch = asyncHandler(async (req, res) => {
  const adminId = req.researcher?._id || req.user?._id;
  const research = await researchService.reactivateResearch(req.params.id, adminId, req.body.reason);

  sendSuccess(res, 200, "Research reactivated successfully.", {
    research: {
      id: research._id,
      status: research.status,
      reactivatedAt: research.reactivatedAt,
      reactivationReason: research.reactivationReason,
    },
  });
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

  let reviewer = req.researcher;
 
  if (!reviewer && req.user) {
    const Researcher = require("../models/ResearcherModel");
    reviewer = await Researcher.findOne({ email: req.user.email })
      .select("_id name email role institution");
    if (!reviewer) {
      throw new AppError(
        "No reviewer profile found for this staff account. Contact your administrator.",
        403,
      );
    }
  }
 
  if (!reviewer) {
    throw new AppError("Reviewer authentication required.", 401);
  }
 
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
  const Research = require("../models/researchModel");

  const isStaff = req.user && ["admin", "superadmin"].includes(req.user.role);

    const isCommittee =
    req.researcher?.role === "research_committee" ||
    req.researcher?.isCommittee === true;

  if (!isStaff && !isCommittee) {
    const research = await Research.findById(req.params.researchId).select(
      "assignedReviewer researcher",
    );

    if (!research) { 
      throw new AppError("Research not found.", 404);
    }

    const reviewerId = req.researcher?._id?.toString();
     const isOwner = research.researcher?.toString() === reviewerId;
    const isCurrentlyAssigned =
      research.assignedReviewer?.toString() === reviewerId;

    const hasAuthoredReview = isCurrentlyAssigned
      ? true
      : await Review.exists({
          research: req.params.researchId,
          reviewer: req.researcher?._id,
        });

    if (!isOwner && !isCurrentlyAssigned && !hasAuthoredReview) {
      throw new AppError(
        "You do not have access to this research's review history.",
        403,
      );  
    }
  }

  const reviews = await Review.getAllForResearch(req.params.researchId);
  sendSuccess(res, 200, "Review history fetched successfully.", { reviews });
});

exports.getReviewerStats = asyncHandler(async (req, res) => {
  const Review = require("../models/ReviewModel");
  const reviewerId = req.researcher?._id || req.user?._id;
  const stats = await Review.getReviewerStats(reviewerId);
  sendSuccess(res, 200, "Reviewer stats fetched successfully.", { stats });
});


//COMMITTEE
exports.getCommitteeQueue = asyncHandler(async (req, res) => {
  const result = await researchService.getCommitteeQueue(req.query);
  sendSuccess(res, 200, "Committee review queue fetched successfully.", result.papers, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

exports.getAllResearchCommittee = asyncHandler(async (req, res) => {
  const result = await researchService.getAllResearchCommittee(req.query);
  sendSuccess(res, 200, "All research fetched successfully.", result.papers, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

exports.submitCommitteeReview = asyncHandler(async (req, res) => {
  const committeeMember = req.researcher; // protectCommittee already validated access
  const { review, research } = await researchService.submitCommitteeReview(committeeMember, req.body);

  sendSuccess(res, 201, "Committee decision recorded successfully.", {
    review: { id: review._id, decision: review.decision, round: review.round, submittedAt: review.submittedAt },
    research: { id: research._id, status: research.status },
  });
});
 
exports.getFinalApprovalQueue = asyncHandler(async (req, res) => {
  const result = await researchService.getFinalApprovalQueue(req.query);
  // Matches the convention used by getAllResearchAdmin/getCommitteeQueue:
  sendSuccess(res, 200, "Final approval queue fetched successfully.", result.records, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});
 
exports.getFinalApprovalStats = asyncHandler(async (req, res) => {
  const stats = await researchService.getFinalApprovalStats();
  sendSuccess(res, 200, "Final approval stats fetched successfully.", stats);
});
 
exports.getApprovalFeed = asyncHandler(async (req, res) => {
  const comments = await researchService.getApprovalFeed(req.query);
  sendSuccess(res, 200, "Approval feed fetched successfully.", { comments });
});
 
exports.postApprovalComment = asyncHandler(async (req, res) => {
  const committeeMember = req.researcher;
  if (!committeeMember) {
    throw new AppError("Committee authentication required.", 401);
  }
  const comment = await researchService.postApprovalComment(committeeMember, {
    researchId: req.body.researchId,
    message: req.body.message,
  });
  sendSuccess(res, 201, "Comment posted successfully.", { comment });
});
exports.getRecordTimeline = asyncHandler(async (req, res) => {
  const timeline = await researchService.getRecordTimeline(req.params.id);
  sendSuccess(res, 200, "Record timeline fetched successfully.", { timeline });
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
  const { research, reviewer, isReassignment } = await researchService.assignReviewer(
    req.params.id,
    req.body.email,
  );
 
  sendSuccess(
    res,
    200,
    isReassignment
      ? `Reviewer re-assigned to ${reviewer.name} successfully.`
      : `${reviewer.name} assigned as reviewer successfully.`,
    {
      research: {
        id: research._id,
        title: research.title,
        assignedReviewer: {
          id: reviewer._id,
          name: reviewer.name,
          email: reviewer.email,
        },
      },
    },
  );
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

