const router = require("express").Router();
const ctrl   = require("../controllers/mpesaController");
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

//  DARAJA WEBHOOK 

router.post("/callback", ctrl.mpesaCallback);

//  PUBLIC

router.post(
  "/initiate",
  optionalResearcher,
  validate(initiatePaymentSchema),
  ctrl.initiatePayment
);


router.get("/verify/:checkoutRequestId", ctrl.verifyPayment);


// Download token
router.get(
  "/download-token/:paymentId/research/:researchId",
  ctrl.getDownloadToken
);

//  ADMIN ROUTES

router.get  ("/admin/revenue",        ...requireAdmin, ctrl.getAllRevenue);
router.get  ("/admin/:id/revenue",    ...requireAdmin, ctrl.getResearchRevenue);
router.post ("/admin/refund",         ...requireAdmin, validate(refundPaymentSchema), ctrl.refundPayment);

module.exports = router;