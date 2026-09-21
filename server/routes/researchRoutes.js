const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/researchController");
const upload = require("../middleware/upload");
const {
  validate,
  proposalInitiateSchema,
  proposalConfirmSchema,
  researchAdminQuerySchema,
  assignReviewerSchema,
  submitReviewSchema,
  reactivateResearchSchema,
  submitCommitteeReviewSchema,
  cscEndorsementSchema,
  returnForCorrectionSchema,
  protocolDeviationSchema,
  coInvestigatorEditAccessSchema,
  coInvestigatorEditSchema,
  studyClosureSchema,
  decisionReportEditSchema,
  committeeReportNoteSchema,
} = require("../utils/validators");

const {
  protectEither,
  protectResearcher,
  optionalResearcher,
  isResearchAdmin,
  protectCommittee,
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
    const staffOk = req.user && ["admin", "superadmin", "research"].includes(req.user.role);
    if (researcherOk || staffOk) return next();
    return next(new AppError("Reviewer or admin access required.", 403));
  },
];

const requireReviewerOrCommittee = [
  protectEither,
  (req, res, next) => {
    const researcherOk = req.researcher?.role === RESEARCHER_ROLES.REVIEWER;
    const staffOk = req.user && ["admin", "superadmin", "research"].includes(req.user.role);
    const committeeOk = req.researcher?.role === RESEARCHER_ROLES.RESEARCH_COMMITTEE || req.researcher?.isCommittee;
    if (researcherOk || staffOk || committeeOk) return next();
    return next(new AppError("Reviewer, committee, or admin access required.", 403));
  },
];


const publicStatsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again shortly.",
    });
  },
});


router.get("/public/stats", publicStatsLimiter, ctrl.getPublicStats);


const uploadProposal = upload("proposal").any();
const uploadProgress = upload("progress").any();
const uploadCscEvidence = upload("csc-evidence").any(); 
const uploadClosure = upload("closure").any(); 
const uploadReviewFeedback = upload("review-feedback").array("attachments", 5); 


router.get("/reviewer/assigned", ...requireReviewer, ctrl.getAssignedResearch);
router.get("/reviewer/stats", ...requireReviewer, ctrl.getReviewerStats);
router.post("/reviews", ...requireReviewer, uploadReviewFeedback, validate(submitReviewSchema), ctrl.submitReview);
router.get("/reviews/:researchId", protectEither, ctrl.getReviewHistory);


router.get("/committee/queue", protectEither, protectCommittee, ctrl.getCommitteeQueue);
router.post("/committee/reviews", protectEither, protectCommittee, validate(submitCommitteeReviewSchema), ctrl.submitCommitteeReview);
router.get("/committee/all", protectEither, protectCommittee, validate(researchAdminQuerySchema, "query"), ctrl.getAllResearchCommittee);
router.get("/committee/final-approvals", protectEither, protectCommittee, ctrl.getFinalApprovalQueue);
router.get("/officer/queue", ...requireAdmin, ctrl.getOfficerReviewQueue);
router.get("/committee/final-approvals/stats", protectEither, protectCommittee, ctrl.getFinalApprovalStats);
router.get("/committee/final-approvals/feed", protectEither, protectCommittee, ctrl.getApprovalFeed);
router.post("/committee/final-approvals/comments", protectEither, protectCommittee, ctrl.postApprovalComment);
router.get("/committee/final-approvals/:id/timeline", protectEither, protectCommittee, ctrl.getRecordTimeline);


router.get("/admin/all", ...requireAdmin, validate(researchAdminQuerySchema, "query"), ctrl.getAllResearchAdmin);
router.get("/admin/stats", ...requireAdmin, ctrl.getDashboardStats);
router.get("/admin/reviewer-workload", ...requireAdmin, ctrl.getReviewerWorkload);


router.get("/my-research", protectResearcher, ctrl.getMyResearch);
router.get("/co-investigator/studies", protectResearcher, ctrl.getCoInvestigatorStudies);
router.get("/:id/revenue", protectEither, ctrl.getMyRevenue);

router.post("/proposals/initiate", optionalResearcher, validate(proposalInitiateSchema), ctrl.initiateProposalPayment);
router.post("/proposals/confirm", protectResearcher, uploadProposal, validate(proposalConfirmSchema), ctrl.confirmProposalSubmission);

router.post("/amendments", protectResearcher, uploadProposal, ctrl.submitAmendment);


router.post("/continuing-reviews", protectResearcher, uploadProgress, ctrl.submitContinuingReview);

router.post("/study-closures", protectResearcher, uploadClosure, validate(studyClosureSchema), ctrl.submitStudyClosure);

router.patch("/:id/resubmit", protectResearcher, uploadProposal, ctrl.resubmit);

router.get("/:id/comments", protectEither, ctrl.getResearchComments);


// Multi-reviewer assignment 
router.post("/:id/reviewers", ...requireAdmin, ctrl.assignReviewers);
router.get("/:id/reviewers", ...requireReviewerOrCommittee, ctrl.getResearchReviewers);
router.delete("/:id/reviewers/:reviewerId", ...requireAdmin, ctrl.removeReviewer);

// Co-investigators on a study
router.get("/:id/co-investigators", protectEither, ctrl.getResearchCoInvestigators);


router.patch(
  "/:id/co-investigators/:coInvestigatorId/edit-access",
  protectResearcher,
  validate(coInvestigatorEditAccessSchema),
  ctrl.setCoInvestigatorEditAccess,
);

router.patch(
  "/:id/co-edit",
  protectResearcher,
  validate(coInvestigatorEditSchema),
  ctrl.coInvestigatorEditResearch,
);

router.patch(
  "/:id/csc-endorsement",
  ...requireAdmin,
  uploadCscEvidence,
  validate(cscEndorsementSchema),
  ctrl.recordCscEndorsement,
);


router.patch("/:id/return-for-correction", ...requireAdmin, validate(returnForCorrectionSchema), ctrl.returnForCorrection);
router.patch("/:id/verify-completeness", ...requireAdmin, ctrl.markCompletenessVerified);

router.post("/protocol-deviations", protectResearcher, uploadProposal, validate(protocolDeviationSchema), ctrl.submitProtocolDeviation);
router.get("/:id/protocol-deviations", protectEither, ctrl.getProtocolDeviations);


router.get("/:id/decision-letter", protectEither, ctrl.getDecisionLetter);
router.get("/:id/decision-letters", protectEither, ctrl.getDecisionLetterHistory);


router.post("/committee/reports", protectEither, protectCommittee, validate(committeeReportNoteSchema), ctrl.addCommitteeReportNote);
router.get("/:id/decision-report", protectEither, ctrl.getDecisionReport);
const uploadOfficerAttachment = upload("officer-reports").single("officerAttachment");
router.patch("/:id/decision-reports/:reportId", ...requireAdmin, uploadOfficerAttachment, validate(decisionReportEditSchema), ctrl.updateDecisionReport);
router.post("/:id/decision-reports/:reportId/release", ...requireAdmin, ctrl.releaseDecisionReport);



router.patch("/:id/assign-reviewer", ...requireAdmin, validate(assignReviewerSchema), ctrl.assignReviewer);

router.patch("/:id/reactivate", ...requireAdmin, ctrl.reactivateResearch);
router.delete("/:id", ...requireAdmin, ctrl.deleteResearch);


router.get("/:id", protectEither, (req, res, next) => {
  if (req.researcher || req.user) return next();
  return next(new AppError("Authentication required.", 401));
}, ctrl.getResearchById);

router.get("/:id/revisions", protectEither, (req, res, next) => {
  if (req.researcher || req.user) return next();
  return next(new AppError("Authentication required.", 401));
}, ctrl.getRevisionComparison);


router.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File too large. Maximum 20MB." });
  }
  if (err.name === "MulterError") {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  next(err);
});

module.exports = router;