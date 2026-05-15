const express = require("express");
const router = express.Router();
const mpesaService = require("../utils/mpesaService");
const Payment = require("../models/PaymentModel");
const Research = require("../models/researchModel");
const Researcher = require("../models/ResearcherModel");
const researchEmail = require("../utils/emailServices");


router.post("/callback", async (req, res) => {
  // ALWAYS respond 200 immediately — Daraja expects a fast ACK
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

  try {
    console.log(
      "[M-Pesa Callback] Received from Daraja:",
      JSON.stringify(req.body, null, 2)
    );

    // Parse the callback using the service
    const parsed = mpesaService.parseCallback(req.body);
    if (!parsed) {
      console.warn("[M-Pesa Callback] Failed to parse callback body");
      return;
    }

    const {
      checkoutRequestId,
      status,
      mpesaReceiptNumber,
      resultCode,
      amount,
      phone,
      transactionDate,
      resultDesc,
    } = parsed;

    console.log(
      ` [M-Pesa Callback] Parsed: CheckoutRequestID=${checkoutRequestId}, Status=${status}`
    );

    // Find the payment record
    const payment = await Payment.findOne({ checkoutRequestId });
    if (!payment) {
      console.warn(
        `[M-Pesa Callback] No payment found for: ${checkoutRequestId}`
      );
      return;
    }

    console.log(`[M-Pesa Callback] Found payment: ${payment._id}`);

    // Process successful payment (ResultCode 0)
    if (status === "complete" && resultCode === "0") {
      console.log(
        `[M-Pesa Callback] Payment SUCCESSFUL: ${mpesaReceiptNumber}`
      );

      // Update payment status
      payment.status = "completed";
      payment.mpesaReceiptNumber = mpesaReceiptNumber;
      payment.transactionDate = transactionDate;
      payment.resultCode = resultCode;
      payment.resultDesc = resultDesc;
      await payment.save();

      console.log(`[M-Pesa Callback] Payment marked as completed`);

      // Send confirmation email to researcher (if exists)
      if (payment.researcher) {
        const researcher = await Researcher.findById(payment.researcher);
        if (researcher && researcher.email) {
          await researchEmail
            .sendPaymentConfirmation(researcher, payment)
            .catch((err) =>
              console.error("Email send error:", err.message)
            );
        }
      }

      // Increment download counter for paper downloads
      if (payment.type === "paper_download" && payment.research) {
        await Research.findByIdAndUpdate(
          payment.research,
          { $inc: { downloads: 1 } },
          { new: false }
        );
        console.log(
          `[M-Pesa Callback] Incremented downloads for research: ${payment.research}`
        );
      }
    } else {
      // Payment failed or was cancelled
      const paymentStatus =
        resultCode === "1032" ? "cancelled" : "failed";
      payment.status = paymentStatus;
      payment.resultCode = resultCode;
      payment.resultDesc = resultDesc;
      await payment.save();

      console.log(
        ` [M-Pesa Callback] Payment ${paymentStatus}: ${resultDesc}`
      );
    }
  } catch (err) {
    console.error(" [M-Pesa Callback] Processing error:", err.message);
    console.error(err.stack);
  }
});


router.get("/verify/:checkoutRequestId", async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

     console.log(`[Verify] Checking: ${checkoutRequestId}`);


    const payment = await Payment.findOne({ checkoutRequestId }).select(
      "status mpesaReceiptNumber amount type research researcher resultCode resultDesc"
    );

      console.log(`[Verify] Found payment:`, payment ? {
      id: payment._id,
      status: payment.status,
      receipt: payment.mpesaReceiptNumber,
      resultCode: payment.resultCode,
      resultDesc: payment.resultDesc,
    } : "NOT FOUND");

    if (!payment) {
        return res.status(404).json({
        message: "Payment record not found",
        checkoutRequestId,
        status: "not_found",
      });
    }

    res.json({
       checkoutRequestId,
      status: payment.status,
      mpesaReceiptNumber: payment.mpesaReceiptNumber || null,
      amount: payment.amount,
      type: payment.type,
      researchId: payment.research || null,
      transactionId: payment.mpesaReceiptNumber,
      resultCode: payment.resultCode,
      resultDesc: payment.resultDesc,
    });
  } catch (err) {
    console.error(" [Verify] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
});


router.post("/stkpush", async (req, res) => {
  try {
    let { phone, amount, researchId, type } = req.body;

    // Determine payment type
    if (!type) {
      type = researchId ? "paper_download" : "proposal_submission";
    }

    if (!["proposal_submission", "paper_download"].includes(type)) {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    // Normalize phone number
    phone = String(phone).replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "254" + phone.slice(1);
    if (!phone.startsWith("254") || phone.length !== 12) {
      return res.status(400).json({
        message: "Enter a valid Safaricom number",
      });
    }


    if (type === "proposal_submission") {
      if (!req.researcher) {
        return res
          .status(401)
          .json({
            message: "Authentication required for proposal submission",
          });
      }

      // Proposal submission amount (1 KES for testing, 150 for production)
      amount = 1;

      if (researchId) {
        const research = await Research.findById(researchId);
        if (!research) {
          return res.status(404).json({ message: "Research not found" });
        }

        if (research.submissionPayment) {
          const existingPayment = await Payment.findById(
            research.submissionPayment
          );
          if (existingPayment && existingPayment.status === "completed") {
            return res.status(400).json({
              message: "You have already paid for this proposal submission",
              mpesaReceiptNumber: existingPayment.mpesaReceiptNumber,
            });
          }
        }
      }

      const accountRef = "ResearchProposal";
      const description = "Research proposal submission fee";

      // Call M-Pesa service to initiate STK Push
      const stkResponse = await mpesaService.initiateSTKPush({
        phone,
        amount,
        accountRef,
        description,
      });

      if (stkResponse.ResponseCode !== "0") {
        return res.status(502).json({
          message: stkResponse.ResponseDescription || "STK Push failed",
        });
      }

      // Create pending payment record in database
      const payment = await Payment.create({
        researcher: req.researcher._id,
        type: "proposal_submission",
        research: researchId || null,
        amount,
        phone,
        merchantRequestId: stkResponse.MerchantRequestID,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        status: "pending",
      });

      console.log(`📱 [STK Push] Created payment record: ${payment._id}`);

      return res.json({
        message:
          stkResponse.CustomerMessage ||
          "STK Push sent. Enter your M-Pesa PIN.",
        checkoutRequestId: stkResponse.CheckoutRequestID,
        paymentId: payment._id,
        amount,
        type: "proposal_submission",
      });
    }


    if (type === "paper_download") {
      if (!researchId) {
        return res
          .status(400)
          .json({ message: "researchId required for download" });
      }

      const research = await Research.findById(researchId).select(
        "downloadPrice isPublished"
      );
      if (!research) {
        return res.status(404).json({ message: "Research not found" });
      }

      if (!research.isPublished) {
        return res
          .status(400)
          .json({ message: "This paper is not yet available for download" });
      }

      // Download amount (1 KES for testing, research.downloadPrice for production)
      amount = 1;

      const accountRef = "ResearchDownload";
      const description = `Research paper download - ${researchId}`;

      // Call M-Pesa service to initiate STK Push
      const stkResponse = await mpesaService.initiateSTKPush({
        phone,
        amount,
        accountRef,
        description,
      });

      if (stkResponse.ResponseCode !== "0") {
        return res.status(502).json({
          message: stkResponse.ResponseDescription || "STK Push failed",
        });
      }

      // Create pending payment record in database
      const payment = await Payment.create({
        researcher: null,
        type: "paper_download",
        research: researchId,
        amount,
        phone,
        merchantRequestId: stkResponse.MerchantRequestID,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        status: "pending",
      });

      console.log(` [STK Push] Created payment record: ${payment._id}`);

      return res.json({
        message:
          stkResponse.CustomerMessage ||
          "STK Push sent. Enter your M-Pesa PIN.",
        checkoutRequestId: stkResponse.CheckoutRequestID,
        paymentId: payment._id,
        amount,
        type: "paper_download",
      });
    }
  } catch (err) {
    console.error("[STK Push] Error:", err.message);
    res.status(500).json({
      message: err.message || "Payment initiation failed",
    });
  }
});

module.exports = router;