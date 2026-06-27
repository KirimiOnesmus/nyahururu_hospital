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

//  PUBLIC ROUTES
 
router.post("/register", validate(registerSchema), ctrl.register);
router.post("/verify-email", validate(verifyEmailSchema), ctrl.verifyEmail);
router.post("/login", validate(loginSchema), ctrl.login);
router.post("/forgot-password", validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), ctrl.resetPassword);


//  ADMIN ROUTES — Staff admin or research admin

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



//  PROTECTED ROUTES — Researcher JWT required
router.use(protectResearcher);

router.get("/me", ctrl.getMe);
router.patch("/profile", validate(updateProfileSchema), ctrl.updateProfile);
router.patch("/change-password", validate(changePasswordSchema), ctrl.changePassword);


module.exports = router;
