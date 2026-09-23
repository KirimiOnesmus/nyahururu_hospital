"use strict";

const crypto   = require("crypto");
const { Op }   = require("sequelize");
const { Payment, Research, Researcher, sequelize } = require("../sequelize/models");
const mpesa    = require("../utils/mpesaService");
const email    = require("../utils/emailServices");
const { AppError } = require("../utils/appError");
const {
  PAYMENT_TYPES,
  PAYMENT_STATUSES,
  FEES,
  TOKEN_TTL,
} = require("../constants/researchIndex");


const initiatePayment = async ({ phone, email: buyerEmail, researchId, type }, researcherId) => {
  const resolvedType =
    type || (researchId ? PAYMENT_TYPES.PAPER_DOWNLOAD : PAYMENT_TYPES.PROPOSAL_SUBMISSION);

  if (!Object.values(PAYMENT_TYPES).includes(resolvedType)) {
    throw new AppError("Invalid payment type.", 400);
  }

  if (resolvedType === PAYMENT_TYPES.PROPOSAL_SUBMISSION && !researcherId) {
    throw new AppError("Authentication required for proposal submission.", 401);
  }

  let amount, accountRef, description, linkedResearchId;

  if (resolvedType === PAYMENT_TYPES.PROPOSAL_SUBMISSION) {
    amount = FEES.PROPOSAL_SUBMISSION;
    accountRef = "Proposal";
    description = "Research proposal submission fee";
    linkedResearchId = null;


    if (researchId) {
      const existing = await Research.findByPk(researchId, {
        attributes: ["submissionPaymentId"],
      });
      if (existing?.submissionPaymentId) {
        const prevPayment = await Payment.findByPk(existing.submissionPaymentId, {
          attributes: ["status", "mpesaReceiptNumber"],
        });
        if (prevPayment?.status === PAYMENT_STATUSES.COMPLETED) {
          throw new AppError(
            `You have already paid for this proposal. Receipt: ${prevPayment.mpesaReceiptNumber}`,
            400,
          );
        }
      }
    }
  } else {
    if (!researchId) {
      throw new AppError("researchId is required for paper downloads.", 400);
    }
    const research = await Research.findOne({
      where: { id: researchId, isPublished: true },
      attributes: ["downloadPrice", "isPublished", "title"],
    });
    if (!research) throw new AppError("Research paper not found or not published.", 404);

    amount = research.downloadPrice ?? FEES.DEFAULT_DOWNLOAD;
    accountRef = "ResearchDL";
    description = `Paper download - ${String(researchId).slice(-8)}`;
    linkedResearchId = researchId;
  }

  const stkResult = await mpesa.initiateSTKPush({ phone, amount, accountRef, description });

  if (stkResult.ResponseCode !== "0") {
    throw new AppError(
      stkResult.ResponseDescription || "Payment initiation failed. Please try again.",
      502,
    );
  }

  const payment = await Payment.create({
    researcherId:      researcherId || null,
    type:              resolvedType,
    researchId:        linkedResearchId,
    amount,
    phone,
    buyerEmail:        buyerEmail || null,
    merchantRequestId: stkResult.MerchantRequestID,
    checkoutRequestId: stkResult.CheckoutRequestID,
    status:            PAYMENT_STATUSES.PENDING,
  });

  return {
    message:           stkResult.CustomerMessage || "STK Push sent. Enter your M-Pesa PIN.",
    checkoutRequestId: stkResult.CheckoutRequestID,
    paymentId:         payment.id,
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

  const {
    checkoutRequestId, status, mpesaReceiptNumber,
    resultCode, resultDesc, transactionDate,
  } = parsed;

  const existing = await Payment.findOne({
    where: { checkoutRequestId },
    attributes: ["status", "mpesaReceiptNumber"],
  });
  if (!existing) {
    console.warn(`[Payment] No payment found for checkoutRequestId: ${checkoutRequestId}`);
    return;
  }
  if (existing.status === PAYMENT_STATUSES.COMPLETED && existing.mpesaReceiptNumber) {
    console.log(`[Payment] Already completed — skipping: ${checkoutRequestId}`);
    return;
  }


  let queryResult = null;
  try {
    queryResult = await mpesa.querySTKStatus(checkoutRequestId);
  } catch (err) {
    console.error(
      `[Payment] STK status re-verification failed for ${checkoutRequestId}:`,
      err.message,
    );
  }

  const verifiedCompleted = queryResult
    ? queryResult.isCompleted
    : status === PAYMENT_STATUSES.COMPLETED;
  const verifiedReceipt    = queryResult?.MpesaReceiptNumber || mpesaReceiptNumber;
  const verifiedResultCode = queryResult?.ResultCode ?? resultCode;
  const verifiedResultDesc = queryResult?.ResultDesc ?? resultDesc;

  const outcome = await sequelize.transaction(async (t) => {
    const payment = await Payment.findOne({
      where: { checkoutRequestId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!payment) return { skipped: "not_found" };
  
    if (payment.status === PAYMENT_STATUSES.COMPLETED) {

      if (!payment.mpesaReceiptNumber && mpesaReceiptNumber) {
        payment.mpesaReceiptNumber = mpesaReceiptNumber;
        payment.transactionDate    = transactionDate || payment.transactionDate;
        await payment.save({ transaction: t });
        return {
          completed: true,
          receiptBackfill: true,
          researcherId: payment.researcherId,
          researchId:   payment.researchId,
          type:         payment.type,
          amount:       payment.amount,
          receipt:      mpesaReceiptNumber,
        };
      }
      return { skipped: "already_completed" };
    }

    if (verifiedCompleted) {
      payment.status             = PAYMENT_STATUSES.COMPLETED;
      payment.mpesaReceiptNumber = verifiedReceipt;
      payment.transactionDate    = transactionDate;
      payment.resultCode         = verifiedResultCode;
      payment.resultDesc         = verifiedResultDesc;
      await payment.save({ transaction: t });
      return {
        completed: true,
        researcherId: payment.researcherId,
        researchId:   payment.researchId,
        type:         payment.type,
        amount:       payment.amount,
        receipt:      verifiedReceipt,
      };
    }


    payment.status     = queryResult ? queryResult.status : status;
    payment.resultCode = verifiedResultCode;
    payment.resultDesc = verifiedResultDesc;
    await payment.save({ transaction: t });
    return { completed: false, status: payment.status };
  });

  if (outcome.skipped === "already_completed") {
    console.log(`[Payment] Race avoided — another callback finalised this one.`);
    return;
  }
  if (outcome.skipped === "not_found") return;

  if (outcome.receiptBackfill) {
    console.log(`[Payment] Receipt backfilled from callback: ${outcome.receipt}`);
  }

  if (outcome.completed) {
    console.log(`[Payment] completed: ${outcome.receipt}`);

    if (outcome.researcherId && outcome.type === PAYMENT_TYPES.PROPOSAL_SUBMISSION) {
      try {
        const researcher = await Researcher.findByPk(outcome.researcherId, {
          attributes: ["email", "name", "firstName"],
        });
        if (researcher) {
          await email.sendPaymentConfirmation({
            email:        researcher.email,
            name:         researcher.name || researcher.firstName,
            mpesaReceipt: outcome.receipt,
            amount:       outcome.amount,
            purpose:      "Research Proposal Submission",
          });
        }
      } catch (err) {
        console.error("[Payment] Confirmation email failed:", err.message);
      }
    }


  } else {
    console.log(`[Payment]  ${outcome.status}: ${verifiedResultDesc}`);
  }
};

const verifyPayment = async (checkoutRequestId) => {
  const payment = await Payment.findOne({
    where: { checkoutRequestId },
    attributes: [
      "id", "status", "mpesaReceiptNumber", "amount", "type",
      "researchId", "resultCode", "resultDesc",
    ],
  });
  if (!payment) throw new AppError("Payment record not found.", 404);


  if (payment.status === PAYMENT_STATUSES.PENDING) {
    try {
      const stkStatus = await mpesa.querySTKStatus(checkoutRequestId);

      if (stkStatus.isCompleted) {
        payment.status             = PAYMENT_STATUSES.COMPLETED;
        payment.mpesaReceiptNumber = stkStatus.MpesaReceiptNumber || payment.mpesaReceiptNumber;
        payment.resultCode         = stkStatus.ResultCode;
        payment.resultDesc         = stkStatus.ResultDesc;
        await payment.save();
      } else if (["failed", "cancelled"].includes(stkStatus.status)) {
        payment.status     = stkStatus.status;
        payment.resultCode = stkStatus.ResultCode;
        payment.resultDesc = stkStatus.ResultDesc;
        await payment.save();
      }
    } catch (err) {

      console.warn(
        `[Payment] STK status query failed for ${checkoutRequestId}:`,
        err.message,
      );
    }
  }

  return {
    checkoutRequestId,
    status:             payment.status,
    mpesaReceiptNumber: payment.mpesaReceiptNumber || null,
    amount:             payment.amount,
    type:               payment.type,
    researchId:         payment.researchId || null,
    resultCode:         payment.resultCode,
    resultDesc:         payment.resultDesc,
  };
};

const generateDownloadToken = async (paymentId, researchId, requesterId, checkoutRequestId) => {

  const payment = await Payment.scope("withSecrets").findOne({
    where: {
      id:         paymentId,
      researchId,
      type:       PAYMENT_TYPES.PAPER_DOWNLOAD,
      status:     PAYMENT_STATUSES.COMPLETED,
    },
    include: [{ model: Research, as: "research", attributes: ["title"] }],
  });

  if (!payment) {
    throw new AppError("Valid completed payment not found for this download.", 403);
  }

  if (payment.researcherId) {
    if (!requesterId || String(payment.researcherId) !== String(requesterId)) {
      throw new AppError("This payment does not belong to your account.", 403);
    }
  } else if (!checkoutRequestId || payment.checkoutRequestId !== checkoutRequestId) {
    throw new AppError("Payment confirmation is required to download this paper.", 403);
  }

  const raw = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + TOKEN_TTL.DOWNLOAD_TOKEN * 60 * 60 * 1000);

  payment.downloadToken = raw;
  payment.downloadTokenExpire = expiry;
  await payment.save();

  let recipientEmail = payment.buyerEmail || null;
  let recipientName = null;

  if (!recipientEmail && payment.researcherId) {
    const researcher = await Researcher.findByPk(payment.researcherId, {
      attributes: ["email", "name", "firstName"],
    });
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


const verifyDownloadToken = async (token, researchId) => {
  return sequelize.transaction(async (t) => {
    const payment = await Payment.scope("withSecrets").findOne({
      where: {
        downloadToken:       token,
        researchId,
        downloadTokenExpire: { [Op.gt]: new Date() },
        status:              PAYMENT_STATUSES.COMPLETED,
      },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!payment) throw new AppError("Download token is invalid or has expired.", 403);

    payment.downloadToken = null;
    payment.downloadTokenExpire = null;
    payment.downloadedAt = new Date();
    await payment.save({ transaction: t });

    await Research.increment("downloads", {
      by: 1,
      where: { id: researchId },
      transaction: t,
    });

    return payment;
  });
};

const refundPayment = async (paymentId, reason) => {
  const payment = await Payment.findByPk(paymentId, {
    include: [
      { model: Researcher, as: "researcher", attributes: ["email", "name", "firstName"] },
    ],
  });
  if (!payment) throw new AppError("Payment not found.", 404);

  if (payment.status !== PAYMENT_STATUSES.COMPLETED) {
    throw new AppError("Only completed payments can be refunded.", 400);
  }
  if (payment.refundedAt) {
    throw new AppError("This payment has already been refunded.", 400);
  }

  let b2cResult;
  try {
    b2cResult = await mpesa.sendB2CPayment({
      phone:   payment.phone,
      amount:  payment.amount,
      remarks: `Refund: ${reason}`.slice(0, 100),
    });
  } catch (err) {

    if (err.message?.startsWith("M-Pesa B2C is not configured")) {
      throw new AppError(
        "Refunds are not yet configured for this deployment. Contact an administrator.",
        503,
      );
    }
    throw err;
  }

  if (!b2cResult.success) {
    throw new AppError(
      `Refund failed: ${b2cResult.ResponseDesc || "M-Pesa error"}`,
      502,
    );
  }

  payment.status       = PAYMENT_STATUSES.REFUNDED;
  payment.refundReason = reason;
  payment.refundedAt   = new Date();
  payment.refundCode   = b2cResult.conversationId;
  payment.refundAmount = payment.amount;
  await payment.save();

  return payment;
};

const getRevenueForResearch = async (researchId) => {
  const payments = await Payment.findAll({
    where: {
      researchId,
      status: PAYMENT_STATUSES.COMPLETED,
    },
    attributes: ["type", "amount", "createdAt", "mpesaReceiptNumber"],
    order: [["createdAt", "DESC"]],
    raw: true,
  });

  let proposalIncome = 0;
  let downloadIncome = 0;
  let downloadCount = 0;

  payments.forEach((p) => {

    const amt = Number(p.amount) || 0;
    if (p.type === PAYMENT_TYPES.PROPOSAL_SUBMISSION) {
      proposalIncome += amt;
    } else if (p.type === PAYMENT_TYPES.PAPER_DOWNLOAD) {
      downloadIncome += amt;
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

const getResearchRevenueAdmin = async (researchId) => {
  const research = await Research.findByPk(researchId, {
    include: [{ model: Researcher, as: "researcher", attributes: ["id", "name", "email"] }],
  });
  if (!research) throw new AppError("Research not found.", 404);

  const revenueData = await getRevenueForResearch(researchId);

  const recentPayments = await Payment.findAll({
    where: { researchId, status: PAYMENT_STATUSES.COMPLETED },
    attributes: ["type", "amount", "createdAt", "mpesaReceiptNumber"],
    order: [["createdAt", "DESC"]],
    limit: 20,
    raw: true,
  });

  return {
    researchId,
    title: research.title,
    researcher: {
      id:    research.researcher.id,
      name:  research.researcher.name,
      email: research.researcher.email,
    },
    proposalIncome: revenueData.proposalIncome,
    downloadIncome: revenueData.downloadIncome,
    totalIncome:    revenueData.totalIncome,
    downloadCount:  research.downloads,
    recentPayments,
  };
};

const getAllRevenueSummary = async ({
  researcherId,
  startDate,
  endDate,
  status = PAYMENT_STATUSES.COMPLETED,
}) => {
  const where = { status };
  if (researcherId) where.researcherId = researcherId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = new Date(startDate);
    if (endDate)   where.createdAt[Op.lte] = new Date(endDate);
  }

  const payments = await Payment.findAll({
    where,
    include: [
      { model: Research,   as: "research",   attributes: ["id", "title"] },
      { model: Researcher, as: "researcher", attributes: ["id", "name", "email"] },
    ],
  });

  const byResearch = {};
  let totalIncome = 0;
  let proposalIncome = 0;
  let downloadIncome = 0;

  payments.forEach((p) => {
    if (!p.research) return;
    const key = String(p.research.id);
    if (!byResearch[key]) {
      byResearch[key] = {
        researchId: p.research.id,
        title: p.research.title,
        proposalIncome: 0,
        downloadIncome: 0,
        totalIncome: 0,
        downloadCount: 0,
      };
    }
    const amt = Number(p.amount) || 0;
    if (p.type === PAYMENT_TYPES.PROPOSAL_SUBMISSION) {
      byResearch[key].proposalIncome += amt;
      proposalIncome += amt;
    } else if (p.type === PAYMENT_TYPES.PAPER_DOWNLOAD) {
      byResearch[key].downloadIncome += amt;
      byResearch[key].downloadCount += 1;
      downloadIncome += amt;
    }
    byResearch[key].totalIncome += amt;
    totalIncome += amt;
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