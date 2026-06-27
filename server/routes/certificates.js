const router = require("express").Router();
const ctrl = require("../controllers/certificateController");
const { protectEither, isResearchAdmin } = require("../middleware/auth");
const { AppError } = require("../utils/appError");
const rateLimit = require("express-rate-limit");


const validId = (param) => (req, res, next) =>
  Types.ObjectId.isValid(req.params[param])
    ? next()
    : next(new AppError(`Invalid ${param}.`, 400));


const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many verification attempts. Try again later.",
  },
});

router.get("/verify", verifyLimiter, ctrl.verifyCertificate);

router.get("/my", protectEither, ctrl.getMyCertificates);

router.get(
  "/research/:researchId",
  protectEither,
  validId("researchId"),
  ctrl.getCertificatesForResearch,
);

router.get(
  "/:id/download",
  protectEither,
  validId("id"),
  ctrl.downloadCertificatePdf,
);

router.patch(
  "/:id/revoke",
  protectEither,
  (req, res, next) => {
    if (isResearchAdmin(req)) return next();
    return next(new AppError("Admin access required.", 403));
  },
  ctrl.revokeCertificate,
);

module.exports = router;
