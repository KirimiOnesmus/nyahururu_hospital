const router = require("express").Router();
const ctrl = require("../controllers/researchController");
const upload = require("../middleware/upload");
const {
  validate,
  proposalInitiateSchema,
  proposalConfirmSchema,
  finalPaperSchema,
  researchAdminQuerySchema, 
  updateDownloadPriceSchema,
  assignReviewerSchema,
  publicResearchQuerySchema,
  submitReviewSchema,
  reactivateResearchSchema,
  progressSubmitSchema,
  submitCommitteeReviewSchema 
} = require("../utils/validators");

const {
  verifyToken,
  authorizeRoles,
  protectEither,
  protectResearcher,
  optionalResearcher,
  restrictTo,
  isResearchAdmin,
  protectCommittee
} = require("../middleware/auth");


const { AppError } = require("../utils/appError");
const { RESEARCHER_ROLES } = require("../constants/researchIndex");

const requireAdmin = [
  protectEither,
  (req, res, next) => {
    if (isResearchAdmin(req)) return next();
    return next(new AppError("Admin access required.", 403));
  },
];

const requireReviewer = [
  protectEither,
  (req, res, next) => {
    const researcherOk = req.researcher && req.researcher.role === RESEARCHER_ROLES.REVIEWER;
    const staffOk = req.user && ["admin", "superadmin"].includes(req.user.role);
    if (researcherOk || staffOk) return next();
    return next(new AppError("Reviewer or admin access required.", 403));
  },
];

const requireReviewerOrCommittee = [
  protectEither,
  (req, res, next) => {
    const researcherOk = req.researcher && req.researcher.role === RESEARCHER_ROLES.REVIEWER;
    const staffOk      = req.user && ["admin", "superadmin"].includes(req.user.role);
    const committeeOk  = req.researcher && (
      req.researcher.role === RESEARCHER_ROLES.RESEARCH_COMMITTEE ||
      req.researcher.isCommittee === true
    );
    if (researcherOk || staffOk || committeeOk) return next();
    return next(new AppError("Reviewer, committee, or admin access required.", 403));
  },
];

// ── File upload config ────────────────────────────────────────────────────────
const uploadProposal   = upload("proposal").any();
const uploadProgress   = upload("progress").any();
const uploadFinalPaper = upload("final_paper").any();

//  PUBLIC ROUTES

router.get(
  "/public",
  validate(publicResearchQuerySchema, "query"),
  ctrl.getPublishedResearch,
);
router.get("/public/:id", ctrl.getPublishedPaperById);

//  REVIEWER ROUTES

router.get("/reviewer/assigned", ...requireReviewer, ctrl.getAssignedResearch);
router.get("/reviewer/stats", ...requireReviewer, ctrl.getReviewerStats);
router.post( 
  "/reviews", 
  ...requireReviewer,
  validate(submitReviewSchema),
  ctrl.submitReview,
);

router.get("/reviews/:researchId", ...requireReviewerOrCommittee, ctrl.getReviewHistory);

//COMMITTEE ROUTES

router.get("/committee/queue", protectEither, protectCommittee, ctrl.getCommitteeQueue);
router.post(
  "/committee/reviews",
  protectEither,
  protectCommittee,
  validate(submitCommitteeReviewSchema),
  ctrl.submitCommitteeReview,
);
router.get(
  "/committee/all",
  protectEither,
  protectCommittee,
  validate(researchAdminQuerySchema, "query"),
  ctrl.getAllResearchCommittee,
);
router.get(
  "/committee/final-approvals",
  protectEither,
  protectCommittee,
  ctrl.getFinalApprovalQueue,
);
 
router.get(
  "/committee/final-approvals/stats",
  protectEither,
  protectCommittee,
  ctrl.getFinalApprovalStats,
);
 
router.get(
  "/committee/final-approvals/feed",
  protectEither,
  protectCommittee,
  ctrl.getApprovalFeed,
);
 
router.post(
  "/committee/final-approvals/comments",
  protectEither,
  protectCommittee,
  ctrl.postApprovalComment,
);

router.get(
  "/committee/final-approvals/:id/timeline",
  protectEither,
  protectCommittee,
  ctrl.getRecordTimeline,
);


//  ADMIN ROUTES

router.get(
  "/admin/all",
  ...requireAdmin,
  validate(researchAdminQuerySchema, "query"),
  ctrl.getAllResearchAdmin,
);
router.get("/admin/stats", ...requireAdmin, ctrl.getDashboardStats);


//  RESEARCHER ROUTES

router.get("/my-research", protectResearcher, ctrl.getMyResearch);
router.get("/:id/revenue", protectResearcher, ctrl.getMyRevenue);

// Proposal payment: optionalResearcher so anonymous requests get a clean 401

router.post(
  "/proposals/initiate",
  optionalResearcher,
  validate(proposalInitiateSchema), 
  ctrl.initiateProposalPayment,
);

router.post(
  "/proposals/confirm",
  protectResearcher,
  uploadProposal,
  validate(proposalConfirmSchema),
  ctrl.confirmProposalSubmission,
);

router.patch(
  "/:id/progress",
  protectResearcher,
  uploadProgress,
  validate(progressSubmitSchema),
  ctrl.submitProgress,
);

router.post(
  "/:id/final-paper",
  protectResearcher,
  uploadFinalPaper,
  validate(finalPaperSchema),
  ctrl.submitFinalPaper,
);

router.patch("/:id/resubmit", protectResearcher, uploadProposal, ctrl.resubmit);


//  ADMIN MANAGEMENT ROUTES (parameterized — declare after named routes)
router.patch(
  "/:id/assign-reviewer",
  ...requireAdmin,
  validate(assignReviewerSchema),
  ctrl.assignReviewer,
);

router.patch("/:id/publish", ...requireAdmin, ctrl.publishResearch);

router.patch(
  "/:id/download-price",
  ...requireAdmin,
  validate(updateDownloadPriceSchema),
  ctrl.updateDownloadPrice,
);

router.delete("/:id", ...requireAdmin, ctrl.deleteResearch);


//  PARAMETERIZED — must be LAST to avoid swallowing named routes above

router.get(
  "/:id",
  protectEither,
  (req, res, next) => {
    if (req.researcher || req.user) return next();
    return next(new AppError("Authentication required.", 401));
  }, 
  ctrl.getResearchById,
);



router.use((err, req, res, next) => { 
  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({ success: false, message: "File too large. Maximum 20MB." });
  }
  if (err.name === "MulterError") { 
    return res
      .status(400)
      .json({ success: false, message: `Upload error: ${err.message}` });
  }
  next(err);
});

module.exports = router;