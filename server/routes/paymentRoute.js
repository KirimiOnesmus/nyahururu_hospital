const router = require("express").Router();
const ctrl   = require("../controllers/mpesaController");
const rateLimit = require("express-rate-limit");
const { createRateLimitHandler, isSuperadminRequest } = require("../middleware/rateLimitHandler");
const { validate, initiatePaymentSchema, refundPaymentSchema } = require("../utils/validators");


const { protectEither,optionalResearcher, isResearchAdmin }= require("../middleware/auth");

const { AppError } = require("../utils/appError");

const requireAdmin = [
  protectEither,
  (req, res, next) => {
    if (isResearchAdmin(req)) return next();
    return next(new AppError("Admin access required.", 403));
  },
];




router.post(
  "/initiate",
  rateLimit({
    skip: isSuperadminRequest,
    windowMs: 15 * 60 * 1000,
    max: 20,
    handler: createRateLimitHandler("Too many payment requests. Please try again later."),
  }),
  optionalResearcher,
  validate(initiatePaymentSchema),
  ctrl.initiatePayment
);

//  DARAJA WEBHOOK 

router.post(
  "/callback/:webhookToken",
  rateLimit({
    skip: isSuperadminRequest,
    windowMs: 5 * 60 * 1000,
    max: 30,
    handler: createRateLimitHandler("Too many payment callbacks. Please try again later."),
  }),
  (req, res, next) => {
    console.log("[Callback] Incoming request on /callback/:webhookToken");
    const expected = process.env.MPESA_CALLBACK_TOKEN;
    if (!expected) {
      console.error("[Callback] MPESA_CALLBACK_TOKEN not set — rejecting");
      return res.status(503).json({ ResultCode: 1, ResultDesc: "Callback not configured" });
    }
    if (req.params.webhookToken !== expected) {
      console.warn("[Callback] Token mismatch — got:", req.params.webhookToken);
      return res.status(404).json({ ResultCode: 1, ResultDesc: "Not found" });
    }
    next();
  },
  ctrl.mpesaCallback
);


const paymentStatusLimiter = rateLimit({
  skip: isSuperadminRequest,
  windowMs: 15 * 60 * 1000,
  max: 30,
  handler: createRateLimitHandler("Too many payment status checks. Please try again later."),
});
router.get("/verify/:checkoutRequestId", paymentStatusLimiter, ctrl.verifyPayment);
router.get("/status/:checkoutRequestId", paymentStatusLimiter, ctrl.verifyPayment);


router.get(
  "/download-token/:paymentId/research/:researchId",
   optionalResearcher,
  rateLimit({
    skip: isSuperadminRequest,
    windowMs: 15 * 60 * 1000,
    max: 10,
    handler: createRateLimitHandler("Too many download requests. Please try again later."),
  }),
  ctrl.getDownloadToken
);
 
router.get(
  "/research/:researchId/download",
  rateLimit({
    skip: isSuperadminRequest,
    windowMs: 15 * 60 * 1000,
    max: 10,
    handler: createRateLimitHandler("Too many download requests. Please try again later."),
  }),
  ctrl.downloadResearchPaper
);

 
//  ADMIN ROUTES

router.get  ("/admin/revenue",        ...requireAdmin, ctrl.getAllRevenue);
router.get  ("/admin/:id/revenue",    ...requireAdmin, ctrl.getResearchRevenue);
router.post ("/admin/refund",         ...requireAdmin, validate(refundPaymentSchema), ctrl.refundPayment);

module.exports = router;
