const crypto   = require("crypto");
const Payment  = require("../models/PaymentModel");
const Research = require("../models/researchModel");
const Researcher = require("../models/ResearcherModel");
const mpesa    = require("../utils/mpesaService")
const email    = require("../utils/emailServices")
const { AppError } = require("../utils/appError");
const {
  PAYMENT_TYPES,
  PAYMENT_STATUSES,
  MPESA_RESULT_CODES,
  FEES,
  TOKEN_TTL,
} = require("../constants/researchIndex");

const initiatePayment = async ({ phone, email, researchId, type }, researcherId) => {

  const resolvedType = type || (researchId ? PAYMENT_TYPES.PAPER_DOWNLOAD : PAYMENT_TYPES.PROPOSAL_SUBMISSION);

  if (!Object.values(PAYMENT_TYPES).includes(resolvedType)) {
    throw new AppError("Invalid payment type.", 400);
  }

  if (resolvedType === PAYMENT_TYPES.PROPOSAL_SUBMISSION && !researcherId) {
    throw new AppError("Authentication required for proposal submission.", 401);
  }


  let amount, accountRef, description, linkedResearchId;

  if (resolvedType === PAYMENT_TYPES.PROPOSAL_SUBMISSION) {
    amount        = FEES.PROPOSAL_SUBMISSION;
    accountRef    = "Proposal";
    description   = "Research proposal submission fee";
    linkedResearchId = null;


    if (researchId) {
      const existing = await Research.findById(researchId).select("submissionPayment");
      if (existing?.submissionPayment) {
        const prevPayment = await Payment.findById(existing.submissionPayment)
          .select("status mpesaReceiptNumber");
        if (prevPayment?.status === PAYMENT_STATUSES.COMPLETED) {
          throw new AppError(
            "You have already paid for this proposal. Receipt: " + prevPayment.mpesaReceiptNumber,
            400
          );
        }
      }
    }
  } else {

    if (!researchId) throw new AppError("researchId is required for paper downloads.", 400);

    const research = await Research.findOne({ _id: researchId, isPublished: true })
      .select("downloadPrice isPublished title");
    if (!research) throw new AppError("Research paper not found or not published.", 404);

    amount           = research.downloadPrice ?? FEES.DEFAULT_DOWNLOAD;
    accountRef       = "ResearchDL";   // max 12 chars
    description      = `Paper download - ${String(researchId).slice(-8)}`;
    linkedResearchId = researchId;
  }


  const stkResult = await mpesa.initiateSTKPush({ phone, amount, accountRef, description });

  if (stkResult.ResponseCode !== "0") {
    throw new AppError(
      stkResult.ResponseDescription || "Payment initiation failed. Please try again.",
      502
    );
  }


  const payment = await Payment.create({
    researcher:        researcherId || null,
    type:              resolvedType,
    research:          linkedResearchId,
    amount,
    phone,
    buyerEmail: email || null,
    merchantRequestId: stkResult.MerchantRequestID,
    checkoutRequestId: stkResult.CheckoutRequestID,
    status:            PAYMENT_STATUSES.PENDING,
  });

  return {
    message:           stkResult.CustomerMessage || "STK Push sent. Enter your M-Pesa PIN.",
    checkoutRequestId: stkResult.CheckoutRequestID,
    paymentId:         payment._id,
    amount,
    type:              resolvedType,
  };
};

//  PROCESS DARAJA CALLBACK

const processCallback = async (body) => {
  const parsed = mpesa.parseCallback(body);
  if (!parsed) {
    console.warn("[Payment] Callback could not be parsed:", JSON.stringify(body));
    return;
  }

  const { checkoutRequestId, status, mpesaReceiptNumber, resultCode, resultDesc, amount, transactionDate } = parsed;

  const payment = await Payment.findOne({ checkoutRequestId });
  if (!payment) {
    console.warn(`[Payment] No payment found for checkoutRequestId: ${checkoutRequestId}`);
    return;
  }


  if (payment.status === PAYMENT_STATUSES.COMPLETED) {
    console.log(`[Payment] Already completed — skipping: ${checkoutRequestId}`);
    return;
  }

  if (status === PAYMENT_STATUSES.COMPLETED) {
    payment.status             = PAYMENT_STATUSES.COMPLETED;
    payment.mpesaReceiptNumber = mpesaReceiptNumber;
    payment.transactionDate    = transactionDate;
    payment.resultCode         = resultCode;
    payment.resultDesc         = resultDesc;
    await payment.save();

    console.log(`[Payment]completed: ${mpesaReceiptNumber}`);

    // Send confirmation email to researcher
    if (payment.researcher && payment.type === PAYMENT_TYPES.PROPOSAL_SUBMISSION) {
      const researcher = await Researcher.findById(payment.researcher)
        .select("email name firstName");
      if (researcher) {
        await email.sendPaymentConfirmation({
          email:   researcher.email,
          name:    researcher.name || researcher.firstName,
          mpesaReceipt: mpesaReceiptNumber,
          amount:  payment.amount,
          purpose: "Research Proposal Submission",
        });
      }
    }


    if (payment.type === PAYMENT_TYPES.PAPER_DOWNLOAD && payment.research) {
      await Research.findByIdAndUpdate(payment.research, { $inc: { downloads: 1 } });
    }

  } else {
    // failed or cancelled
    payment.status     = status;
    payment.resultCode = resultCode;
    payment.resultDesc = resultDesc;
    await payment.save();

    console.log(`[Payment] ✗ ${status}: ${resultDesc}`);
  }
};

//  VERIFY PAYMENT STATUS

const verifyPayment = async (checkoutRequestId) => {
  const payment = await Payment.findOne({ checkoutRequestId })
    .select("status mpesaReceiptNumber amount type research resultCode resultDesc");

  if (!payment) throw new AppError("Payment record not found.", 404);

  return {
    checkoutRequestId,
    status:             payment.status,
    mpesaReceiptNumber: payment.mpesaReceiptNumber || null,
    amount:             payment.amount,
    type:               payment.type,
    researchId:         payment.research || null,
    resultCode:         payment.resultCode,
    resultDesc:         payment.resultDesc,
  };
};

//  GENERATE SECURE DOWNLOAD TOKEN


const generateDownloadToken = async (paymentId, researchId, requesterId) => {
  const payment = await Payment.findOne({
    _id: paymentId,
    research: researchId,
    type: PAYMENT_TYPES.PAPER_DOWNLOAD,
    status: PAYMENT_STATUSES.COMPLETED,
  }).populate("research", "title");

  if (!payment) {
    throw new AppError("Valid completed payment not found for this download.", 403);
  }

  if (payment.researcher && requesterId && payment.researcher.toString() !== requesterId.toString()) {
    throw new AppError("This payment does not belong to your account.", 403);
  }

  const raw = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + TOKEN_TTL.DOWNLOAD_TOKEN * 60 * 60 * 1000);

  payment.downloadToken = raw;
  payment.downloadTokenExpire = expiry;
  await payment.save();

  // Prefer the anonymous buyer's supplied email; fall back to the logged-in researcher's account email so registered users always get their receipt + one-time download link.

  let recipientEmail = payment.buyerEmail || null;
  let recipientName = null;

  if (!recipientEmail && payment.researcher) {
    const researcher = await Researcher.findById(payment.researcher).select("email name firstName");
    if (researcher) {
      recipientEmail = researcher.email;
      recipientName = researcher.name || researcher.firstName;
    }
  }

  if (recipientEmail) {
    const downloadLink = `${process.env.FRONTEND_URL}/research/${researchId}/download?token=${raw}`;
    await email.sendDownloadReceipt({
      email: recipientEmail,
      name: recipientName,
      proposalTitle: payment.research?.title,
      mpesaReceipt: payment.mpesaReceiptNumber,
      amount: payment.amount,
      downloadLink,
    });
  }

  return { downloadToken: raw, expiresAt: expiry };
};

//  VERIFY DOWNLOAD TOKEN

const verifyDownloadToken = async (token, researchId) => {
  const payment = await Payment.findOne({
    downloadToken: token,
    research: researchId,
    downloadTokenExpire: { $gt: new Date() },
    status: PAYMENT_STATUSES.COMPLETED,
  }).select("+downloadToken +downloadTokenExpire");

  if (!payment) throw new AppError("Download token is invalid or has expired.", 403);

  // One-time use: burn the token immediately
  payment.downloadToken = null;
  payment.downloadTokenExpire = null;
  payment.downloadedAt = new Date();
  await payment.save();

  // Count the ACTUAL download here, not at payment-completion time
  await Research.findByIdAndUpdate(researchId, { $inc: { downloads: 1 } });

  return payment;
};

//  REFUND PAYMENT (Admin only)

const refundPayment = async (paymentId, reason) => {
  const payment = await Payment.findById(paymentId)
    .populate("researcher", "email name firstName");
  if (!payment) throw new AppError("Payment not found.", 404);

  if (payment.status !== PAYMENT_STATUSES.COMPLETED) {
    throw new AppError("Only completed payments can be refunded.", 400);
  }
  if (payment.refundedAt) {
    throw new AppError("This payment has already been refunded.", 400);
  }

  const b2cResult = await mpesa.sendB2CPayment({
    phone:   payment.phone,
    amount:  payment.amount,
    remarks: `Refund: ${reason}`.slice(0, 100),
  });

  if (!b2cResult.success) {
    throw new AppError(`Refund failed: ${b2cResult.ResponseDesc || "M-Pesa error"}`, 502);
  }

  payment.status      = PAYMENT_STATUSES.REFUNDED;
  payment.refundReason = reason;
  payment.refundedAt   = new Date();
  payment.refundCode   = b2cResult.conversationId;
  payment.refundAmount = payment.amount;
  await payment.save();

  return payment;
};

//  REVENUE — single research, researcher-facing


const getRevenueForResearch = async (researchId) => {
  const payments = await Payment.find({
    research: researchId,
    status: PAYMENT_STATUSES.COMPLETED,
  })
    .select("type amount createdAt mpesaReceiptNumber")
    .lean();

  let proposalIncome = 0;
  let downloadIncome = 0;
  let downloadCount = 0;

  payments.forEach((p) => {
    if (p.type === PAYMENT_TYPES.PROPOSAL_SUBMISSION) {
      proposalIncome += p.amount;
    } else if (p.type === PAYMENT_TYPES.PAPER_DOWNLOAD) {
      downloadIncome += p.amount;
      downloadCount += 1;
    }
  });

  return {
    proposalIncome,
    downloadIncome,
    totalIncome: proposalIncome + downloadIncome,
    downloadCount,
    payments,
  };
};

//  REVENUE — single research, admin-facing 

const getResearchRevenueAdmin = async (researchId) => {
  const research = await Research.findById(researchId).populate(
    "researcher",
    "name email",
  );
  if (!research) throw new AppError("Research not found.", 404);

  const revenueData = await getRevenueForResearch(researchId);

  const recentPayments = await Payment.find({
    research: researchId,
    status: PAYMENT_STATUSES.COMPLETED,
  })
    .select("type amount createdAt mpesaReceiptNumber")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return {
    researchId,
    title: research.title,
    researcher: {
      id: research.researcher._id,
      name: research.researcher.name,
      email: research.researcher.email,
    },
    proposalIncome: revenueData.proposalIncome,
    downloadIncome: revenueData.downloadIncome,
    totalIncome: revenueData.totalIncome,
    downloadCount: research.downloads,
    recentPayments,
  };
};

//  REVENUE — platform-wide summary (admin dashboard)
const getAllRevenueSummary = async ({
  researcherId,
  startDate,
  endDate,
  status = PAYMENT_STATUSES.COMPLETED,
}) => {
  const filter = { status };
  if (researcherId) filter.researcher = researcherId;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const payments = await Payment.find(filter)
    .populate("research", "title")
    .populate("researcher", "name email")
    .lean();

  const byResearch = {};
  let totalIncome = 0;
  let proposalIncome = 0;
  let downloadIncome = 0;

  payments.forEach((p) => {
    if (!p.research) return;
    const key = p.research._id.toString();
    if (!byResearch[key]) {
      byResearch[key] = {
        researchId: p.research._id,
        title: p.research.title,
        proposalIncome: 0,
        downloadIncome: 0,
        totalIncome: 0,
        downloadCount: 0,
      };
    }
    if (p.type === PAYMENT_TYPES.PROPOSAL_SUBMISSION) {
      byResearch[key].proposalIncome += p.amount;
      proposalIncome += p.amount;
    } else if (p.type === PAYMENT_TYPES.PAPER_DOWNLOAD) {
      byResearch[key].downloadIncome += p.amount;
      byResearch[key].downloadCount += 1;
      downloadIncome += p.amount;
    }
    byResearch[key].totalIncome += p.amount;
    totalIncome += p.amount;
  });

  const sorted = Object.values(byResearch).sort(
    (a, b) => b.totalIncome - a.totalIncome,
  );

  return {
    totalIncome,
    proposalIncome,
    downloadIncome,
    totalPayments: payments.length,
    proposalSubmissions: payments.filter(
      (p) => p.type === PAYMENT_TYPES.PROPOSAL_SUBMISSION,
    ).length,
    paperDownloads: payments.filter(
      (p) => p.type === PAYMENT_TYPES.PAPER_DOWNLOAD,
    ).length,
    totalResearch: sorted.length,
    byResearch: sorted,
  };
};

module.exports = {
  initiatePayment,
  processCallback,
  verifyPayment,
  generateDownloadToken,
  verifyDownloadToken,
  refundPayment,
  getRevenueForResearch,
  getResearchRevenueAdmin,
  getAllRevenueSummary,
};