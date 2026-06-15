const paymentService = require("../services/paymentService");

const {asyncHandler,sendSuccess}= require("../utils/appError");


//intiate payment
exports.initiatePayment = asyncHandler(async (req,res)=>{
const result = await paymentService.initiatePayment(
  req,body,
  res.researcher?.id || null
);
sendSuccess(res,200,result.message,result);
})

//  Must respond 200 immediately before any processing.

exports.mpesaCallback =asyncHandler (async (req,res)=>{
  res.status(200).json({ResultCode: 0,ResultDesc :" Accepted"});

  paymentService.processCallback(req.body).catch((err)=>{
    console.error("[Callback] processing error:", err.message, err.stack);
  });
});

//  Polled by frontend every 3 seconds to check payment completion.

exports.verifyPayment =asyncHandler(async(req,res)=>{
  const result =await paymentService.verifyPayment(req.params.checkoutRequestId);
  sendSuccess(res,200," Payment status retrived.", result);
});

//  Generates a 15-minute signed token to authorize a file download.

exports.getDownloadToken =asyncHandler(async(req,res)=>{
  const {paymentId,researchId }= req.params;
  const result = await paymentService.generateDownloadToken(paymentId, researchId);
  sendSuccess(res, 200, "Download token generated. Valid for 15 minutes.", result);
});

//ADMIN

exports.getResearchRevenue =asyncHandler(async(req,res)=>{
  const researchService = require(" ../researchServices/researchService");
  const result = await researchService.getResearchRevenueAdmin(req.params.id);
  sendSuccess(res, 200, " Research revenue fetched successfully.", result);
});

exports.getAllRevenue =asyncHandler(async(req,res)=>{
  const researchService = require ("../researchServices/researchService");
  const result = await researchService.getAllRevenueSummary (req.query);
  sendSuccess(res, 200, "Revenue summary fetched successfully.", result);
});


exports. refundPayment =asyncHandler(async(req,res)=>{
  const{paymentId, reason}= req.body;
  const payment = await paymentService.refundPayment(paymentId, reason);
  sendSuccess(res, 200, " Payment refunded successfully.",{payment});
});



