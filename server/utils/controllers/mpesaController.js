"use strict";

const path = require("path");
const { Research } = require("../sequelize/models");
const paymentService = require("../services/paymentService");

const { asyncHandler, sendSuccess, AppError } = require("../utils/appError");

// ── Initiate payment ────────────────────────────────────────────────
exports.initiatePayment = asyncHandler(async (req, res) => {
  const result = await paymentService.initiatePayment(
    req.body,
    req.researcher?.id || null,
  );
  sendSuccess(res, 200, result.message, result);
});

// ── M-Pesa callback endpoint ────────────────────────────────────────
// Must respond 200 immediately before any processing — Safaricom
// treats a timeout as a failure and retries, which would double-
// process. The retry hazard is separately handled by the race-safe
// paymentService.processCallback flow.
exports.mpesaCallback = asyncHandler(async (req, res) => {
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

  paymentService.processCallback(req.body).catch((err) => {
    console.error("[Callback] processing error:", err.message, err.stack);
  });
});

// ── Polled by frontend every ~3s to check payment completion ────────
exports.verifyPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyPayment(
    req.params.checkoutRequestId,
  );
  sendSuccess(res, 200, "Payment status retrieved.", result);
});

// ── Generate a signed one-time download token (15 min TTL) ──────────
exports.getDownloadToken = asyncHandler(async (req, res) => {
  const { paymentId, researchId } = req.params;
  const result = await paymentService.generateDownloadToken(
    paymentId,
    researchId,
    req.researcher?.id || null,
  );
  sendSuccess(res, 200, "Download token generated. Valid for 15 minutes.", result);
});

// ── Redeem the download token and stream the research paper ─────────
exports.downloadResearchPaper = asyncHandler(async (req, res) => {
  const { researchId } = req.params;
  const { token } = req.query;

  if (!token) throw new AppError("Download token is required.", 400);

  // Burns the token, increments the download counter (both
  // race-safe under the transactional lock in the service).
  await paymentService.verifyDownloadToken(token, researchId);

  const research = await Research.findOne({
    where: { id: researchId, isPublished: true },
    attributes: ["finalPaperFile", "title"],
  });

  if (!research?.finalPaperFile) throw new AppError("Research file not found.", 404);

  const filePath = path.join(process.cwd(), research.finalPaperFile.replace(/^\//, ""));
  return res.download(filePath, `${research.title.slice(0, 60)}.pdf`);
});

// ── ADMIN ───────────────────────────────────────────────────────────

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
  sendSuccess(res, 200, "Payment refunded successfully.", { payment });
});
