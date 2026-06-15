const crypto   = require("crypto");
const Payment  = require("../models/PaymentModel");
const Research = require("../models/ResearchModel");
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

const initiatePayment = async ({ phone, researchId, type }, researcherId) => {
  
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


const generateDownloadToken = async (paymentId, researchId) => {
  const payment = await Payment.findOne({
    _id:      paymentId,
    research: researchId,
    type:     PAYMENT_TYPES.PAPER_DOWNLOAD,
    status:   PAYMENT_STATUSES.COMPLETED,
  });

  if (!payment) {
    throw new AppError("Valid completed payment not found for this download.", 403);
  }

  const raw     = crypto.randomBytes(32).toString("hex");
  const expiry  = new Date(Date.now() + TOKEN_TTL.DOWNLOAD_TOKEN * 60 * 60 * 1000);

  payment.downloadToken       = raw;
  payment.downloadTokenExpire = expiry;
  await payment.save();

  return { downloadToken: raw, expiresAt: expiry };
};

//  VERIFY DOWNLOAD TOKEN

const verifyDownloadToken = async (token, researchId) => {
  const payment = await Payment.findOne({
    downloadToken:       token,
    research:            researchId,
    downloadTokenExpire: { $gt: new Date() },
    status:              PAYMENT_STATUSES.COMPLETED,
  }).select("+downloadToken +downloadTokenExpire");

  if (!payment) throw new AppError("Download token is invalid or has expired.", 403);


  payment.downloadToken       = null;
  payment.downloadTokenExpire = null;
  payment.downloadedAt        = new Date();
  await payment.save();

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

module.exports = {
  initiatePayment,
  processCallback,
  verifyPayment,
  generateDownloadToken,
  verifyDownloadToken,
  refundPayment,
};

