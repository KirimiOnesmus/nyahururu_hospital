const router = require("express").Router();
const ctrl   = require("../controllers/mpesaController");
const rateLimit = require("express-rate-limit");
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
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }),
  optionalResearcher,
  validate(initiatePaymentSchema),
  ctrl.initiatePayment
);

//  DARAJA WEBHOOK 

router.post(
  "/callback/:webhookToken",
  rateLimit({ windowMs: 5 * 60 * 1000, max: 30 }),
  (req, res, next) => {
    const expected = process.env.MPESA_CALLBACK_TOKEN;
    if (!expected) {
      // Not configured — fail closed rather than silently accepting
      // unauthenticated callbacks in an environment that forgot to set it.
      return res.status(503).json({ ResultCode: 1, ResultDesc: "Callback not configured" });
    }
    if (req.params.webhookToken !== expected) {
      return res.status(404).json({ ResultCode: 1, ResultDesc: "Not found" });
    }
    next();
  },
  ctrl.mpesaCallback
);


router.get("/verify/:checkoutRequestId", ctrl.verifyPayment);



router.get(
  "/download-token/:paymentId/research/:researchId",
   optionalResearcher,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  ctrl.getDownloadToken
);
 
router.get(
  "/research/:researchId/download",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), 
  ctrl.downloadResearchPaper
);

 
//  ADMIN ROUTES

router.get  ("/admin/revenue",        ...requireAdmin, ctrl.getAllRevenue);
router.get  ("/admin/:id/revenue",    ...requireAdmin, ctrl.getResearchRevenue);
router.post ("/admin/refund",         ...requireAdmin, validate(refundPaymentSchema), ctrl.refundPayment);

module.exports = router;