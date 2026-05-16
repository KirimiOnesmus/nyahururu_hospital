const Research = require("../models/researchModel");
const Payment = require("../models/PaymentModel");
const Researcher = require("../models/ResearcherModel");
const researchEmail = require("../utils/emailServices");

exports.getAllResearch = async (req, res) => {
  try {
    const research = await Research.find({ isPublished: true })
      .select("title abstract researcher downloadPrice downloads createdAt")
      .populate("researcher", "name institution")
      .sort({ createdAt: -1 });

    res.json(research);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get research by ID (public endpoint)
exports.getResearchById = async (req, res) => {
  try {
    const item = await Research.findById(req.params.id)
      .populate("researcher", "name institution bio socialLinks")
      .populate("reviewedBy", "name");

    if (!item) return res.status(404).json({ message: "Research not found" });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//STEP 1: Initiate proposal submission
//Validates form data and triggers M-Pesa STK Push.

exports.initiateProposalSubmission = async (req, res) => {
  try {
    const {
      title,
      discipline,
      abstract,
      background,
      objectives,
      methodology,
      expectedOutcome,
      timeline,
      phone,
      // amount = 100, Default proposal submission fee
      amount = 1, // Set to 1 KES for testing. Change to 100 for production.
      type = "proposal_submission",
    } = req.body;

    // Validate required fields
    if (!title || !discipline || !abstract || !phone) {
      return res.status(400).json({
        message: "Title, discipline, abstract, and phone are required",
      });
    }

    // Normalize and validate phone
    let normalizedPhone = String(phone).replace(/\D/g, "");
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "254" + normalizedPhone.slice(1);
    }
    if (!normalizedPhone.startsWith("254") || normalizedPhone.length !== 12) {
      return res.status(400).json({
        message:
          "Enter a valid Safaricom number (e.g., 0712345678 or 254712345678)",
      });
    }

    // Import M-Pesa service
    const mpesaService = require("../utils/mpesaService");

    // Initiate M-Pesa STK Push
    const stkResponse = await mpesaService.initiateSTKPush({
      phone: normalizedPhone,
      amount,
      accountRef: "Proposal",
      description: "Research proposal submission fee",
    });

    if (stkResponse.ResponseCode !== "0") {
      return res.status(502).json({
        message: stkResponse.ResponseDescription || "Payment initiation failed",
      });
    }

    // Create pending payment record
    const payment = await Payment.create({
      researcher: req.researcher?._id || null,
      type,
      amount,
      phone: normalizedPhone,
      merchantRequestId: stkResponse.MerchantRequestID,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      status: "pending",
    });

    // Return payment tracking info to frontend
    res.json({
      message: "STK Push sent. Check your phone and enter your M-Pesa PIN.",
      checkoutRequestId: stkResponse.CheckoutRequestID,
      paymentId: payment._id,
      amount,
      phone: normalizedPhone,
      // Frontend should use this to poll payment status every 5 seconds
    });
  } catch (error) {
    console.error("Proposal submission initiation error:", error);
    res.status(500).json({
      message: error.message || "Failed to initiate proposal submission",
    });
  }
};

//STEP 2: Confirm proposal submission after payment
//Verifies payment was completed, uploads PDF, and creates research record.

exports.confirmProposalSubmission = async (req, res) => {
  try {

     console.log('req.body:', req.body);           // ← add
    console.log('req.query:', req.query);         // ← add  
    console.log('req.files:', req.files); 

    if (!req.researcher) {
      return res.status(401).json({ message: "Authentication required" });
    }

   const paymentId = req.query.paymentId || req.body.paymentId;

    const {
      title,
      discipline,
      abstract,
      background,
      objectives,
      methodology,
      expectedOutcome,
      timeline,
    } = req.body;

    // Validate required fields
    if (!title || !discipline || !paymentId) {
      return res.status(400).json({
        message: "Title, discipline, and paymentId are required",
      });
    }

    // Verify payment was completed
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        message: "Payment record not found",
      });
    }

    if (payment.status !== "completed") {
      return res.status(400).json({
        message: `Payment status is ${payment.status}. Ensure M-Pesa payment succeeded.`,
      });
    }

    if (!payment.researcher) {
      payment.researcher = req.researcher._id;
      await payment.save();
      console.log(`[Confirm Proposal] Linked researcher to payment`);
    }

    // Extract uploaded file if present
    const uploadedFile = Array.isArray(req.files)
      ? req.files.find((f) => f.fieldname === "proposalFile")
      : req.files?.proposalFile?.[0];

    const proposalFile = uploadedFile
      ? `/uploads/research/${uploadedFile.filename}`
      : null;

    // Create research document
    const newResearch = await Research.create({
      title,
      discipline,
      abstract,
      background,
      objectives,
      methodology,
      expectedOutcome,
      timeline,
      proposalFile,
      researcher: req.researcher._id,
      stage: "proposal",
      status: "pending", // Awaiting reviewer approval
      submissionPayment: payment._id,
      isPublished: false, // Not public until final paper is approved
      downloadPrice: 50, // Default price
      downloads: 0,
    });

    // Link payment to research
    payment.research = newResearch._id;
    await payment.save();

    // Send confirmation email to researcher
await researchEmail.sendProposalSubmitted({
  email: req.researcher.email,
  name: req.researcher.name || req.researcher.firstName,
  proposalTitle: newResearch.title,
  mpesaReceipt: payment.mpesaReceiptNumber,
  amount: payment.amount,
}).catch((err) => console.error("Email error:", err));

    res.status(201).json({
      message: "Proposal submitted successfully! Awaiting reviewer feedback.",
      research: {
        id: newResearch._id,
        title: newResearch.title,
        stage: newResearch.stage,
        status: newResearch.status,
        submittedAt: newResearch.createdAt,
      },
      payment: {
        amount: payment.amount,
        transactionId: payment.merchantRequestId,
      },
    });
  } catch (error) {
    console.error("Confirm proposal submission error:", error);
    res.status(500).json({
      message: error.message || "Failed to confirm proposal submission",
    });
  }
};

//Submit final paper for an approved proposal

exports.submitFinalPaper = async (req, res) => {
  try {
    if (!req.researcher) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { researchId } = req.params;
    const { finalAbstract, keywords } = req.body;

    const research = await Research.findById(researchId);
    if (!research) {
      return res.status(404).json({ message: "Research not found" });
    }

    // Verify ownership
    if (research.researcher.toString() !== req.researcher._id.toString()) {
      return res.status(403).json({
        message: "You can only submit papers for your own research",
      });
    }

    // Check stage and approval status
    if (research.stage !== "proposal") {
      return res.status(400).json({
        message: `Cannot submit final paper. Current stage is '${research.stage}'`,
      });
    }

    if (research.status !== "approved") {
      return res.status(400).json({
        message:
          "Your proposal must be approved before submitting the final paper",
      });
    }

    // Handle file upload
    const finalPaperFile = req.files?.finalPaperFile
      ? `/uploads/research/${req.files.finalPaperFile[0].filename}`
      : null;

    if (!finalPaperFile) {
      return res.status(400).json({ message: "Final paper file is required" });
    }

    // Update research
    research.finalAbstract = finalAbstract || research.abstract;
    research.keywords = keywords || [];
    research.finalPaperFile = finalPaperFile;
    research.stage = "final_paper";
    research.status = "pending"; // Reset to pending for final paper review
    research.updatedAt = new Date();

    await research.save();

    // Send confirmation email
    await researchEmail
      .sendFinalPaperSubmissionConfirmation(req.researcher, research)
      .catch((err) => console.error("Email error:", err));

    res.json({
      message: "Final paper submitted successfully. Awaiting review.",
      research: {
        id: research._id,
        title: research.title,
        stage: research.stage,
        status: research.status,
      },
    });
  } catch (error) {
    console.error("Submit final paper error:", error);
    res.status(500).json({
      message: error.message || "Failed to submit final paper",
    });
  }
};

//Update download price (admin only)

exports.updateDownloadPrice = async (req, res) => {
  try {
    const { downloadPrice } = req.body;

    if (downloadPrice === undefined || downloadPrice < 0) {
      return res.status(400).json({ message: "Valid download price required" });
    }

    const research = await Research.findByIdAndUpdate(
      req.params.id,
      { downloadPrice },
      { new: true },
    );

    if (!research) {
      return res.status(404).json({ message: "Research not found" });
    }

    res.json({
      message: "Download price updated",
      research: {
        id: research._id,
        title: research.title,
        downloadPrice: research.downloadPrice,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get researcher's revenue data
exports.getResearcherRevenue = async (req, res) => {
  try {
    if (!req.researcher) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id: researchId } = req.params;

    const research = await Research.findById(researchId);
    if (!research) {
      return res.status(404).json({ message: "Research not found" });
    }

    // Verify ownership
    if (research.researcher.toString() !== req.researcher._id.toString()) {
      return res.status(403).json({
        message: "You can only view revenue for your own research",
      });
    }

    // Get download payments
    const downloadPayments = await Payment.find({
      research: researchId,
      type: "paper_download",
      status: "completed",
    }).select("amount createdAt");

    const totalDownloadRevenue = downloadPayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    res.json({
      research: {
        id: research._id,
        title: research.title,
        downloads: research.downloads,
        downloadPrice: research.downloadPrice,
      },
      revenue: {
        totalFromDownloads: totalDownloadRevenue,
        downloadCount: downloadPayments.length,
        estimatedEarnings: research.downloads * research.downloadPrice,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update research (admin only)
 */
exports.updateResearch = async (req, res) => {
  try {
    const { title, downloadPrice } = req.body;
    const updates = {};

    if (title) updates.title = title;
    if (downloadPrice !== undefined) updates.downloadPrice = downloadPrice;

    const research = await Research.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (!research) {
      return res.status(404).json({ message: "Research not found" });
    }

    res.json({
      message: "Research updated",
      research,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete research (admin only)
 */
exports.deleteResearch = async (req, res) => {
  try {
    const deleted = await Research.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Research not found" });
    }

    res.json({ message: "Research deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
