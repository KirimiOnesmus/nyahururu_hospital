const router = require("express").Router();
const ctrl = require("../controllers/researcherController");
const {
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  adminCreateResearcherSchema,
} = require("../utils/validators");

const {
  protectEither,
  protectResearcher,
  restrictTo,
  isResearchAdmin,
} = require("../middleware/auth");

const { RESEARCHER_ROLES } = require("../constants/researchIndex");
const { AppError } = require("../utils/appError");


router.post("/register", validate(registerSchema), ctrl.register);
router.post("/verify-email", validate(verifyEmailSchema), ctrl.verifyEmail);
router.post("/login", validate(loginSchema), ctrl.login);
router.post("/logout", ctrl.logout);
router.post("/forgot-password", validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), ctrl.resetPassword);

router.post(
  "/admin/create",
  protectEither,
  (req, res, next) => { 
    if (isResearchAdmin(req)) return next();
    return next(new AppError("Admin access required.", 403));
  },
  validate(adminCreateResearcherSchema),
  ctrl.adminCreateResearcher,
);

//  Admin-accessible listing (staff token accepted) 
router.get(
  "/",
  protectEither,
  (req, res, next) => {
    if (isResearchAdmin(req)) return next();
    return next(new AppError("Admin access required.", 403));
  },
  ctrl.listAll,
);


router.use(protectResearcher);

router.get("/me", ctrl.getMe);
router.patch("/profile", validate(updateProfileSchema), ctrl.updateProfile);
router.patch("/change-password", validate(changePasswordSchema), ctrl.changePassword);


module.exports = router;