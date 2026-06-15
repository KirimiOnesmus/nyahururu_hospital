const router = require("express").Router();
const ctrl = require("../controllers/reviewerController");
const {
  validate,
  inviteReviewerSchema,
  setPasswordSchema,
  updateReviewerSchema,
} = require("../utils/validators");

const { protectEither,
  isResearchAdmin

 } = require("../middleware/auth");
 

const { AppError } = require("../utils/appError");

const requireAdmin = [
  protectEither,
  (req, res, next) => {
    if (isResearchAdmin(req)) return next();
    return next(new AppError("Admin access required.", 403));
  },
];

//  PUBLIC
router.post("/set-password", validate(setPasswordSchema), ctrl.setPassword);

//  ADMIN ROUTES

router.get("/", ...requireAdmin, ctrl.listReviewers);

router.get("/all", ...requireAdmin, ctrl.listAllResearchers);

router.post(
  "/invite",
  ...requireAdmin,
  validate(inviteReviewerSchema),
  ctrl.inviteReviewer,
);

router.post("/:id/resend-invite", ...requireAdmin, ctrl.resendInvite);

router.patch("/:id/revoke", ...requireAdmin, ctrl.revokeReviewer);

router.patch("/:id/promote-admin", ...requireAdmin, ctrl.promoteToAdmin);

router.patch(
  "/:id",
  ...requireAdmin,
  validate(updateReviewerSchema),
  ctrl.updateReviewer,
);

module.exports = router;
