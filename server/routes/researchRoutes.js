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
} = require("../utils/validators");

const {
  verifyToken,
  authorizeRoles,
  protectEither,
    protectResearcher,
  optionalResearcher,
  restrictTo,
  isResearchAdmin,
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
    const researcherOk =
      req.researcher &&
      [
        RESEARCHER_ROLES.REVIEWER,
        RESEARCHER_ROLES.ADMIN,
        RESEARCHER_ROLES.SUPERADMIN,
      ].includes(req.researcher.role);
    const staffOk =
      req.user &&
      [RESEARCHER_ROLES.ADMIN, RESEARCHER_ROLES.SUPERADMIN].includes(
        req.user.role,
      );

    if (researcherOk || staffOk) return next();
    return next(new AppError("Reviewer or admin access required.", 403));
  },
];

// ── File upload config ────────────────────────────────────────────────────────
const uploader = upload("research");
const uploadAny = uploader.any();

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
router.get("/reviews/:researchId", ...requireAdmin, ctrl.getReviewHistory);

//  ADMIN ROUTES

router.get(
  "/admin/all",
  ...requireAdmin,
  validate(researchAdminQuerySchema, "query"),
  ctrl.getAllResearchAdmin,
);
router.get("/admin/stats", ...requireAdmin, ctrl.getDashboardStats);
router.get("/admin/revenue", ...requireAdmin, ctrl.getAllRevenue);
router.get("/admin/:id/revenue", ...requireAdmin, ctrl.getResearchRevenue);

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
  uploadAny,
  validate(proposalConfirmSchema),
  ctrl.confirmProposalSubmission,
);

router.post(
  "/:id/final-paper",
  protectResearcher,
  uploadAny,
  validate(finalPaperSchema),
  ctrl.submitFinalPaper,
);

router.patch("/:id/resubmit", protectResearcher, uploadAny, ctrl.resubmit);


//  ADMIN MANAGEMENT ROUTES (parameterized — declare after named routes)
router.patch(
  "/admin/:id/assign-reviewer",
  ...requireAdmin,
  validate(assignReviewerSchema),
  ctrl.assignReviewer,
);

router.patch("/admin/:id/publish", ...requireAdmin, ctrl.publishResearch);

router.patch(
  "/admin/:id/download-price",
  ...requireAdmin,
  validate(updateDownloadPriceSchema),
  ctrl.updateDownloadPrice,
);

router.delete("/admin/:id", ...requireAdmin, ctrl.deleteResearch);


//  PARAMETERIZED — must be LAST to avoid swallowing named routes above


router.get("/:id", ...requireReviewer, ctrl.getResearchById);

//  MULTER ERROR HANDLER

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
