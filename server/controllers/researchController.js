const Research      = require("../models/researchModel");
const Payment       = require("../models/PaymentModel");
const Researcher    = require("../models/ResearcherModel");
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

exports.initiateProposalSubmission = async (req, res) => {
  try {
    // Researcher only
    if (!req.researcher) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const {
      title, discipline, abstract,
      background, objectives, methodology,
      expectedOutcome, timeline, teamMembers, references,
      phone
    } = req.body;

    // Validate required fields
    if (!title || !discipline) {
      return res.status(400).json({ 
        message: "Title and discipline are required" 
      });
    }

    if (!phone) {
      return res.status(400).json({ 
        message: "Phone number required for M-Pesa payment" 
      });
    }

    
    let normalizedPhone = String(phone).replace(/\D/g, "");
    if (normalizedPhone.startsWith("0")) normalizedPhone = "254" + normalizedPhone.slice(1);
    if (!normalizedPhone.startsWith("254") || normalizedPhone.length !== 12) {
      return res.status(400).json({ message: "Enter a valid Safaricom number" });
    }

    // Import M-Pesa service for STK push
    const mpesaService = require("../utils/mpesaService");

    const amount = 150; // Fixed proposal fee
    const accountRef = "ResearchProposal";
    const description = "Research proposal submission fee";

    // Initiate M-Pesa payment
    const stkResponse = await mpesaService.initiateSTKPush({
      phone: normalizedPhone,
      amount,
      accountRef,
      description,
    });

    if (stkResponse.ResponseCode !== "0") {
      return res.status(502).json({ 
        message: stkResponse.ResponseDescription || "Payment initiation failed" 
      });
    }

    // Create pending payment record
    const payment = await Payment.create({
      researcher: req.researcher._id,
      type: "proposal_submission",
      amount,
      phone: normalizedPhone,
      merchantRequestId: stkResponse.MerchantRequestID,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      status: "pending",
    });

    // Store proposal data temporarily (in session or cache)
    // OR return it to frontend to resubmit after payment
    res.json({
      message: "STK Push sent. Enter your M-Pesa PIN to proceed.",
      checkoutRequestId: stkResponse.CheckoutRequestID,
      paymentId: payment._id,
      amount,
      proposalData: {
        title, discipline, abstract,
        background, objectives, methodology,
        expectedOutcome, timeline, teamMembers, references,
      }
    });

  } catch (error) {
    console.error("Proposal submission error:", error);
    res.status(500).json({ message: error.message || "Failed to initiate proposal submission" });
  }
};


exports.confirmProposalSubmission = async (req, res) => {
  try {
    // Researcher only
    if (!req.researcher) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const {
      paymentId, checkoutRequestId,
      title, discipline, abstract,
      background, objectives, methodology,
      expectedOutcome, timeline, teamMembers, references
    } = req.body;

    if (!title || !discipline) {
      return res.status(400).json({ 
        message: "Title and discipline are required" 
      });
    }

    // Verify payment was completed
    const paymentQuery = paymentId 
      ? { _id: paymentId, researcher: req.researcher._id }
      : { checkoutRequestId, researcher: req.researcher._id };

    const payment = await Payment.findOne(paymentQuery);

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (payment.status !== "completed") {
      return res.status(400).json({ 
        message: `Payment status is ${payment.status}. Ensure M-Pesa payment succeeded.` 
      });
    }

    // Handle file upload if provided
    const proposalFile = req.files?.proposal
      ? `/uploads/research/${req.files.proposal[0].filename}`
      : null;

    // Create research document with payment linked
    const newResearch = await Research.create({
      title,
      discipline,
      abstract,
      background,
      objectives,
      methodology,
      expectedOutcome,
      timeline,
      teamMembers,
      references,
      proposalFile,
      researcher: req.researcher._id,
      stage: "proposal",
      status: "pending", // Awaiting review
      submissionPayment: payment._id,
    });

    // Link payment to research
    payment.research = newResearch._id;
    await payment.save();

    // Send confirmation email to researcher
    await researchEmail.sendProposalSubmissionConfirmation(
      req.researcher,
      newResearch,
      payment
    ).catch(console.error);

    res.status(201).json({
      message: "Proposal submitted successfully. Awaiting review.",
      research: newResearch,
      payment: {
        mpesaReceiptNumber: payment.mpesaReceiptNumber,
        amount: payment.amount,
      }
    });

  } catch (error) {
    console.error("Confirm proposal error:", error);
    res.status(500).json({ message: error.message || "Failed to confirm proposal submission" });
  }
};

exports.submitFinalPaper = async (req, res) => {
  try {
    // Researcher only
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
      return res.status(403).json({ message: "You can only submit papers for your own research" });
    }

    // Check if proposal is approved
    if (research.stage !== "proposal") {
      return res.status(400).json({ 
        message: `Cannot submit final paper. Current stage is '${research.stage}'` 
      });
    }

    if (research.status !== "approved") {
      return res.status(400).json({ 
        message: "Your proposal must be approved before submitting final paper" 
      });
    }

    // Handle file upload
    const finalPaperFile = req.files?.paper
      ? `/uploads/research/${req.files.paper[0].filename}`
      : null;

    if (!finalPaperFile) {
      return res.status(400).json({ message: "Final paper file is required" });
    }


    research.finalAbstract = finalAbstract || research.abstract;
    research.keywords = keywords || [];
    research.finalPaperFile = finalPaperFile;
    research.stage = "final_paper";
    research.status = "pending"; // Reset to pending for final paper review
    research.updatedAt = new Date();

    await research.save();

    // Send confirmation email
    await researchEmail.sendFinalPaperSubmissionConfirmation(
      req.researcher,
      research
    ).catch(console.error);

    res.json({
      message: "Final paper submitted successfully. Awaiting review.",
      research,
    });

  } catch (error) {
    console.error("Submit final paper error:", error);
    res.status(500).json({ message: error.message || "Failed to submit final paper" });
  }
};


exports.updateDownloadPrice = async (req, res) => {
  try {
    // Admin only
    if (req.user?.role !== "admin" && req.user?.role !== "superadmin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { downloadPrice } = req.body;

    if (!downloadPrice || downloadPrice < 0) {
      return res.status(400).json({ message: "Valid download price required" });
    }

    const research = await Research.findByIdAndUpdate(
      req.params.id,
      { downloadPrice },
      { new: true }
    );

    if (!research) return res.status(404).json({ message: "Research not found" });

    res.json({ message: "Download price updated", research });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


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

    //  Verify ownership
    if (research.researcher.toString() !== req.researcher._id.toString()) {
      return res.status(403).json({ message: "You can only view revenue for your own research" });
    }

    // Get download payments
    const downloadPayments = await Payment.find({
      research: researchId,
      type: "paper_download",
      status: "completed",
    }).select("amount createdAt");

    const totalDownloadRevenue = downloadPayments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      research: {
        id: research._id,
        title: research.title,
        downloads: research.downloads,
      },
      revenue: {
        totalFromDownloads: totalDownloadRevenue,
        downloadCount: downloadPayments.length,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Keep existing endpoints for backward compatibility
exports.createResearch = async (req, res) => {
  return res.status(400).json({ 
    message: "Use POST /api/research/proposals to submit research" 
  });
};

exports.updateResearch = async (req, res) => {
  try {
    const { title, downloadPrice } = req.body;
    const updates = {};

    if (title) updates.title = title;
    if (downloadPrice !== undefined) updates.downloadPrice = downloadPrice;

    const research = await Research.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!research) return res.status(404).json({ message: "Research not found" });

    res.json({ message: "Research updated", research });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteResearch = async (req, res) => {
  try {
    //  Admin only
    if (req.user?.role !== "admin" && req.user?.role !== "superadmin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const deleted = await Research.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Research not found" });

    res.json({ message: "Research deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};