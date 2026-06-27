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



//  PUBLIC

// Public — no auth required, since anonymous purchases are the primary use case
router.post(
  "/initiate",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }),
  optionalResearcher,
  validate(initiatePaymentSchema),
  ctrl.initiatePayment
);

//  DARAJA WEBHOOK 

router.post("/callback", ctrl.mpesaCallback);


router.get("/verify/:checkoutRequestId", ctrl.verifyPayment);


// Download token
router.get(
  "/download-token/:paymentId/research/:researchId",
   optionalResearcher,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  ctrl.getDownloadToken
);
 
router.get(
  "/research/:researchId/download",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), // token-guessing throttle, defense in depth alongside the token itself
  ctrl.downloadResearchPaper
);

 
//  ADMIN ROUTES

router.get  ("/admin/revenue",        ...requireAdmin, ctrl.getAllRevenue);
router.get  ("/admin/:id/revenue",    ...requireAdmin, ctrl.getResearchRevenue);
router.post ("/admin/refund",         ...requireAdmin, validate(refundPaymentSchema), ctrl.refundPayment);

module.exports = router;