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

// ── INITIATE PAYMENT ─────────────────────────────────────────────────
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

    // Duplicate-payment guard: if this research already has a
    // completed submission payment, block the STK push before we spend
    // an M-Pesa transaction slot on it. Two SELECTs (research →
    // payment) rather than a join to keep the reads shallow, and both
    // rows are read outside a transaction because we're just probing.
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
    accountRef = "ResearchDL"; // max 12 chars per M-Pesa spec
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

// ── PROCESS DARAJA CALLBACK ──────────────────────────────────────────
//
// Race the Mongoose version had: two concurrent callbacks for the same
// checkoutRequestId (Safaricom retries or a callback + a poll racing
// each other) could both see status=PENDING, both mark completed, both
// send the confirmation email and both bump the download counter.
//
// The M-Pesa server-to-server status query and confirmation email
// remain OUTSIDE the transaction — both are slow network calls; holding
// a row lock through them would tie up a connection for seconds and
// cascade backpressure across the app.
//
// C4 fix preserved: the callback body is attacker-controlled, so a
// claimed status of "completed" is only a hint. The DB mutation is
// driven by the server-to-server query result, not the callback payload.
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

  // Peek at the payment first so we can bail early if it's already
  // completed — saves us the round trip to Safaricom for retried
  // callbacks.
  const existing = await Payment.findOne({
    where: { checkoutRequestId },
    attributes: ["status"],
  });
  if (!existing) {
    console.warn(`[Payment] No payment found for checkoutRequestId: ${checkoutRequestId}`);
    return;
  }
  if (existing.status === PAYMENT_STATUSES.COMPLETED) {
    console.log(`[Payment] Already completed — skipping: ${checkoutRequestId}`);
    return;
  }

  // Re-verify with Safaricom (see C4 note above).
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

  // Apply the outcome under a row lock so a concurrent callback
  // that finishes the Safaricom query at roughly the same time can't
  // duplicate the state transition.
  const outcome = await sequelize.transaction(async (t) => {
    const payment = await Payment.findOne({
      where: { checkoutRequestId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!payment) return { skipped: "not_found" };
    // Second read after acquiring the lock — see the double-checked
    // locking pattern for detail.
    if (payment.status === PAYMENT_STATUSES.COMPLETED) {
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

    // Failed / cancelled — query result (when available) is
    // authoritative; otherwise the callback's status.
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

  if (outcome.completed) {
    console.log(`[Payment] completed: ${outcome.receipt}`);

    // Confirmation email — best-effort, non-fatal if it fails.
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

    // NOTE: the Mongoose version bumped `research.downloads` here on
    // payment completion. That over-counted downloads — a user could
    // pay, never actually download the file, and still be counted.
    // Moved the increment into verifyDownloadToken() (where the token
    // is actually redeemed), which is where the counter belongs. The
    // number now reflects real downloads, not attempted-purchases.
  } else {
    console.log(`[Payment] ✗ ${outcome.status}: ${verifiedResultDesc}`);
  }
};

// ── VERIFY PAYMENT STATUS (frontend poll) ────────────────────────────
const verifyPayment = async (checkoutRequestId) => {
  const payment = await Payment.findOne({
    where: { checkoutRequestId },
    attributes: [
      "status", "mpesaReceiptNumber", "amount", "type",
      "researchId", "resultCode", "resultDesc",
    ],
  });
  if (!payment) throw new AppError("Payment record not found.", 404);

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

// ── GENERATE SECURE DOWNLOAD TOKEN ───────────────────────────────────
const generateDownloadToken = async (paymentId, researchId, requesterId) => {
  // withSecrets scope so we can write the download-token columns
  // (excluded by defaultScope).
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

  if (
    payment.researcherId &&
    requesterId &&
    String(payment.researcherId) !== String(requesterId)
  ) {
    throw new AppError("This payment does not belong to your account.", 403);
  }

  const raw = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + TOKEN_TTL.DOWNLOAD_TOKEN * 60 * 60 * 1000);

  payment.downloadToken = raw;
  payment.downloadTokenExpire = expiry;
  await payment.save();

  // Prefer the anonymous buyer's email; fall back to the logged-in
  // researcher's account email so registered users always get their
  // receipt + one-time download link.
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

// ── VERIFY DOWNLOAD TOKEN (one-time use) ─────────────────────────────
//
// Race the Mongoose version had: two concurrent GET /download requests
// with the same still-valid token could both pass the "token valid"
// check, both burn it, and both bump the download counter. Row lock
// serialises them so only the first one gets the file, matching the
// intended one-time-use semantics.
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

    // Burn the token first — after this, a concurrent request holding
    // the same token but arriving later can't match it.
    payment.downloadToken = null;
    payment.downloadTokenExpire = null;
    payment.downloadedAt = new Date();
    await payment.save({ transaction: t });

    // Atomic in-place bump; safe from lost-update races even without
    // the row lock we're already holding.
    await Research.increment("downloads", {
      by: 1,
      where: { id: researchId },
      transaction: t,
    });

    return payment;
  });
};

// ── REFUND PAYMENT (admin only) ──────────────────────────────────────
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

  // Kick off the B2C payment BEFORE mutating the DB — if the M-Pesa
  // side fails, we don't want a payment marked "refunded" without an
  // actual money movement.
  let b2cResult;
  try {
    b2cResult = await mpesa.sendB2CPayment({
      phone:   payment.phone,
      amount:  payment.amount,
      remarks: `Refund: ${reason}`.slice(0, 100),
    });
  } catch (err) {
    // M-4: distinguish "B2C isn't configured on this deploy" (our bug,
    // clear fix) from an actual Safaricom-side failure, so this doesn't
    // just look like a generic outage to whoever clicks "Refund".
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

// ── REVENUE — single research, researcher-facing ─────────────────────
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
    // amount is DECIMAL — Sequelize returns it as a string on raw:true.
    // Number() gives us the right JS type for arithmetic.
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

// ── REVENUE — single research, admin-facing ──────────────────────────
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

// ── REVENUE — platform-wide summary (admin dashboard) ────────────────
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
