const mpesaService  = require("../utils/mpesaService");
const Payment       = require("../models/PaymentModel");
const Research      = require("../models/researchModel");
const Researcher    = require("../models/ResearcherModel");
const researchEmail = require("../utils/emailServices");


exports.initiateSTKPush = async (req, res) => {
  try {
    let { phone, amount, researchId, type } = req.body;

    // Type determination
    if (!type) {
      type = researchId ? "paper_download" : "proposal_submission";
    }

    if (!["proposal_submission", "paper_download"].includes(type)) {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    /* ── Normalise phone to 2547XXXXXXXX ── */
    phone = String(phone).replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "254" + phone.slice(1);
    if (!phone.startsWith("254") || phone.length !== 12) {
      return res.status(400).json({ message: "Enter a valid Safaricom number" });
    }

    /* ── PROPOSAL SUBMISSION (Researcher only, 150 KES) ── */
    if (type === "proposal_submission") {
      if (!req.researcher) {
        return res.status(401).json({ message: "Authentication required for proposal submission" });
      }

      amount = 150; // Fixed amount for proposal

      // Check if researcher already paid for a proposal (if researchId provided)
      if (researchId) {
        const research = await Research.findById(researchId);
        if (!research) {
          return res.status(404).json({ message: "Research not found" });
        }

        // If payment already made, don't allow re-payment
        if (research.submissionPayment) {
          const existingPayment = await Payment.findById(research.submissionPayment);
          if (existingPayment && existingPayment.status === "completed") {
            return res.status(400).json({
              message: "You have already paid for this proposal submission",
              mpesaReceiptNumber: existingPayment.mpesaReceiptNumber,
            });
          }
        }
      }

      const accountRef  = "ResearchProposal";
      const description = "Research proposal submission fee";

      const stkResponse = await mpesaService.initiateSTKPush({
        phone, amount, accountRef, description,
      });

      if (stkResponse.ResponseCode !== "0") {
        return res.status(502).json({ 
          message: stkResponse.ResponseDescription || "STK Push failed" 
        });
      }

      /* ── Create pending Payment record ── */
      const payment = await Payment.create({
        researcher:        req.researcher._id,
        type:              "proposal_submission",
        research:          researchId || null,
        amount,
        phone,
        merchantRequestId: stkResponse.MerchantRequestID,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        status:            "pending",
      });

      return res.json({
        message:          stkResponse.CustomerMessage || "STK Push sent. Enter your M-Pesa PIN.",
        checkoutRequestId: stkResponse.CheckoutRequestID,
        paymentId:        payment._id,
        amount,
        type:             "proposal_submission",
      });
    }

    /* ── PAPER DOWNLOAD (Public, dynamic price) ── */
    if (type === "paper_download") {
      if (!researchId) {
        return res.status(400).json({ message: "researchId required for download" });
      }

      const research = await Research.findById(researchId).select("downloadPrice isPublished");
      if (!research) {
        return res.status(404).json({ message: "Research not found" });
      }

      if (!research.isPublished) {
        return res.status(400).json({ message: "This paper is not yet available for download" });
      }

      amount = research.downloadPrice || 150; // Use research's download price

      const accountRef  = "ResearchDownload";
      const description = `Research paper download - ${researchId}`;

      const stkResponse = await mpesaService.initiateSTKPush({
        phone, amount, accountRef, description,
      });

      if (stkResponse.ResponseCode !== "0") {
        return res.status(502).json({ 
          message: stkResponse.ResponseDescription || "STK Push failed" 
        });
      }

      /* ── Create pending Payment record (NO researcher for public) ── */
      const payment = await Payment.create({
        researcher:        null, // Public download - no researcher
        type:              "paper_download",
        research:          researchId,
        amount,
        phone,
        merchantRequestId: stkResponse.MerchantRequestID,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        status:            "pending",
      });

      return res.json({
        message:          stkResponse.CustomerMessage || "STK Push sent. Enter your M-Pesa PIN.",
        checkoutRequestId: stkResponse.CheckoutRequestID,
        paymentId:        payment._id,
        amount,
        type:             "paper_download",
      });
    }
  } catch (err) {
    console.error("STK Push error:", err.response?.data || err.message);
    res.status(500).json({ message: err.message || "Payment initiation failed" });
  }
};


exports.mpesaCallback = async (req, res) => {
  /* Always respond 200 immediately — Daraja expects a fast ACK */
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });

  try {
    const parsed = mpesaService.parseCallback(req.body);
    if (!parsed) {
      console.warn("[Mpesa Callback] Could not parse callback body");
      return;
    }

    const payment = await Payment.findOne({
      checkoutRequestId: parsed.checkoutRequestId,
    });

    if (!payment) {
      console.warn(`[Mpesa Callback] No payment found for checkoutRequestId: ${parsed.checkoutRequestId}`);
      return;
    }

    if (parsed.resultCode === 0) {
  
      payment.status             = "completed";
      payment.mpesaReceiptNumber = parsed.mpesaReceiptNumber;
      payment.transactionDate    = parsed.transactionDate;
      payment.resultCode         = 0;
      payment.resultDesc         = parsed.resultDesc;
      await payment.save();

      /* Send payment confirmation email to researcher (if exists) */
      if (payment.researcher) {
        const researcher = await Researcher.findById(payment.researcher);
        if (researcher) {
          await researchEmail.sendPaymentConfirmation(researcher, payment).catch(console.error);
        }
      }

      /* For proposal payments, increment download counter on research (for tracking) */
      if (payment.type === "proposal_submission" && payment.research) {
        // Track proposal payment completion
        console.log(`[Mpesa] Proposal submission paid: ${parsed.mpesaReceiptNumber}`);
      }

      /* For paper downloads, increment views */
      if (payment.type === "paper_download" && payment.research) {
        await Research.findByIdAndUpdate(
          payment.research,
          { $inc: { downloads: 1 } },
          { new: false }
        );
        console.log(`[Mpesa] Paper download paid: ${parsed.mpesaReceiptNumber}`);
      }

      console.log(`[Mpesa] Payment completed: ${parsed.mpesaReceiptNumber}`);
    } else {
  
      payment.status     = parsed.resultCode === 1032 ? "cancelled" : "failed";
      payment.resultCode = parsed.resultCode;
      payment.resultDesc = parsed.resultDesc;
      await payment.save();

      console.log(`[Mpesa] Payment ${payment.status}: ${parsed.resultDesc}`);
    }
  } catch (err) {
    console.error("[Mpesa Callback] Processing error:", err.message);
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const filter = {
      checkoutRequestId: req.params.checkoutRequestId,
    };

    // If authenticated researcher, restrict to their payments (for security)
    if (req.researcher) {
      filter.researcher = req.researcher._id;
    }
    // Public can check payment without researcher filter

    const payment = await Payment.findOne(filter).select(
      "status mpesaReceiptNumber amount type research researcher"
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    res.json({
      status:             payment.status,
      mpesaReceiptNumber: payment.mpesaReceiptNumber,
      amount:             payment.amount,
      type:               payment.type,
      researchId:         payment.research,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getResearchRevenue = async (req, res) => {
  try {
    // Admin only
    if (req.user?.role !== "admin" && req.user?.role !== "superadmin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { researchId } = req.params;

    const research = await Research.findById(researchId).select("title researcher downloads");
    if (!research) {
      return res.status(404).json({ message: "Research not found" });
    }

    // Get all completed payments for this research
    const payments = await Payment.find({
      research: researchId,
      status: "completed",
    }).select("type amount createdAt mpesaReceiptNumber");

    // Calculate breakdown
    const proposalPayment = payments.find(p => p.type === "proposal_submission");
    const downloadPayments = payments.filter(p => p.type === "paper_download");

    const proposalAmount = proposalPayment ? proposalPayment.amount : 0;
    const downloadAmount = downloadPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalRevenue = proposalAmount + downloadAmount;

    const researcher = await Researcher.findById(research.researcher).select("name email");

    res.json({
      researchId,
      title: research.title,
      researcher: {
        id: researcher._id,
        name: researcher.name,
        email: researcher.email,
      },
      revenue: {
        proposalSubmission: {
          amount: proposalAmount,
          count: proposalPayment ? 1 : 0,
        },
        paperDownloads: {
          amount: downloadAmount,
          count: downloadPayments.length,
        },
        total: totalRevenue,
      },
      downloadCount: research.downloads,
      paymentDetails: payments.map(p => ({
        type: p.type,
        amount: p.amount,
        date: p.createdAt,
        receipt: p.mpesaReceiptNumber,
      })),
    });
  } catch (err) {
    console.error("getResearchRevenue error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllResearchRevenue = async (req, res) => {
  try {
   
    if (req.user?.role !== "admin" && req.user?.role !== "superadmin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { researcher: researcherId, startDate, endDate, status = "completed" } = req.query;

    // Build filter for payments
    const paymentFilter = { status };
    if (researcherId) {
      paymentFilter.research = researcherId;
    }

    // Get all completed payments
    const payments = await Payment.find(paymentFilter)
      .populate("research", "title")
      .populate("researcher", "name email");

    // Group by research
    const revenueByResearch = {};
    let totalRevenue = 0;

    payments.forEach(payment => {
      const key = payment.research._id.toString();
      
      if (!revenueByResearch[key]) {
        revenueByResearch[key] = {
          researchId: payment.research._id,
          title: payment.research.title,
          proposalRevenue: 0,
          downloadRevenue: 0,
          proposalCount: 0,
          downloadCount: 0,
          totalRevenue: 0,
        };
      }

      if (payment.type === "proposal_submission") {
        revenueByResearch[key].proposalRevenue += payment.amount;
        revenueByResearch[key].proposalCount += 1;
      } else if (payment.type === "paper_download") {
        revenueByResearch[key].downloadRevenue += payment.amount;
        revenueByResearch[key].downloadCount += 1;
      }

      revenueByResearch[key].totalRevenue = 
        revenueByResearch[key].proposalRevenue + revenueByResearch[key].downloadRevenue;

      totalRevenue += payment.amount;
    });

    const revenue = Object.values(revenueByResearch).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    res.json({
      summary: {
        totalRevenue,
        totalPayments: payments.length,
        totalResearch: revenue.length,
        proposalSubmissions: payments.filter(p => p.type === "proposal_submission").length,
        paperDownloads: payments.filter(p => p.type === "paper_download").length,
      },
      byResearch: revenue,
    });
  } catch (err) {
    console.error("getAllResearchRevenue error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.refundPayment = async (req, res) => {
  try {

    if (req.user?.role !== "admin" && req.user?.role !== "superadmin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { paymentId, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "completed") {
      return res.status(400).json({ message: "Only completed payments can be refunded" });
    }

    // ✅ Call M-Pesa refund API (pseudocode)
    const refundResponse = await mpesaService.initiateRefund({
      transactionId: payment.mpesaReceiptNumber,
      amount: payment.amount,
      reason,
    });

    if (refundResponse.ResponseCode !== "0") {
      return res.status(502).json({ 
        message: refundResponse.ResponseDescription || "Refund failed" 
      });
    }

    payment.status = "refunded";
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    payment.refundCode = refundResponse.ConversationID;
    await payment.save();

    res.json({
      message: "Payment refunded successfully",
      payment,
    });
  } catch (err) {
    console.error("refundPayment error:", err);
    res.status(500).json({ message: err.message });
  }
};