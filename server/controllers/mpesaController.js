const path = require("path");
const Research = require("../models/researchModel");
const paymentService = require("../services/paymentService");

const { asyncHandler, sendSuccess, AppError } = require("../utils/appError");

//intiate payment
exports.initiatePayment = asyncHandler(async (req, res) => {
  const result = await paymentService.initiatePayment(
    req.body,
    req.researcher?._id || null,
  );
  sendSuccess(res, 200, result.message, result);
});

//  Must respond 200 immediately before any processing.

exports.mpesaCallback = asyncHandler(async (req, res) => {
  res.status(200).json({ ResultCode: 0, ResultDesc: " Accepted" });

  paymentService.processCallback(req.body).catch((err) => {
    console.error("[Callback] processing error:", err.message, err.stack);
  });
});

//  Polled by frontend every 3 seconds to check payment completion.

exports.verifyPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyPayment(
    req.params.checkoutRequestId,
  );
  sendSuccess(res, 200, " Payment status retrived.", result);
});
//  Generates a 15-minute signed token to authorize a file download.

exports.getDownloadToken = asyncHandler(async (req, res) => {
  const { paymentId, researchId } = req.params;
  const result = await paymentService.generateDownloadToken(
    paymentId,
    researchId,
    req.researcher?._id || null,
  );
  sendSuccess(
    res,
    200,
    "Download token generated. Valid for 15 minutes.",
    result,
  );
}); //  Verifies the download token and increments the research's download count.


exports.downloadResearchPaper = asyncHandler(async (req, res) => {
  const { researchId } = req.params;
  const { token } = req.query;

  if (!token) throw new AppError("Download token is required.", 400);

  await paymentService.verifyDownloadToken(token, researchId);

  const research = await Research.findOne({ _id: researchId, isPublished: true }).select("finalPaperFile title");

  if (!research?.finalPaperFile) throw new AppError("Research file not found.", 404);

  const filePath = path.join(process.cwd(), research.finalPaperFile.replace(/^\//, ""));
  return res.download(filePath, `${research.title.slice(0, 60)}.pdf`);
});

//ADMIN

exports.getResearchRevenue = asyncHandler(async (req, res) => {
  const result = await paymentService.getResearchRevenueAdmin(req.params.id); 
  sendSuccess(res, 200, "Research revenue fetched successfully.", result);
});

exports.getAllRevenue = asyncHandler(async (req, res) => {
  const result = await paymentService.getAllRevenueSummary(req.query); 
  sendSuccess(res, 200, "Revenue summary fetched successfully.", result);
});

exports.refundPayment = asyncHandler(async (req, res) => {
  const { paymentId, reason } = req.body;
  const payment = await paymentService.refundPayment(paymentId, reason);
  sendSuccess(res, 200, " Payment refunded successfully.", { payment });
});
