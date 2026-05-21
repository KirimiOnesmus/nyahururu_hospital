const Research = require("../models/researchModel");
const Payment = require("../models/PaymentModel");
const Researcher = require("../models/ResearcherModel");
const researchEmail = require("../utils/emailServices");

//published research papers (public endpoint)
exports.getAllPublishedResearch = async (req, res) => {
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
      .populate("assignedReviewer", "name firstName lastName email institution")
      .populate("reviewedBy", "name");

    if (!item) return res.status(404).json({ message: "Research not found" });

    res.json(item); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

    if (!title || !discipline || !abstract || !phone) {
      return res.status(400).json({
        message: "Title, discipline, abstract, and phone are required",
      });
    }

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
    });
  } catch (error) {
    console.error("Proposal submission initiation error:", error);
    res.status(500).json({
      message: error.message || "Failed to initiate proposal submission",
    });
  }
};

//Verifies payment was completed, uploads PDF, and creates research record.

exports.confirmProposalSubmission = async (req, res) => {
  try {
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

    if (!title || !discipline || !paymentId) {
      return res.status(400).json({
        message: "Title, discipline, and paymentId are required",
      });
    }

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

    const uploadedFile = Array.isArray(req.files)
      ? req.files.find((f) => f.fieldname === "proposalFile")
      : req.files?.proposalFile?.[0];

    const proposalFile = uploadedFile
      ? `/uploads/research/${uploadedFile.filename}`
      : null;

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
      status: "pending",
      submissionPayment: payment._id,
      isPublished: false,
      downloadPrice: 50,
      downloads: 0,
    });

    // Link payment to research
    payment.research = newResearch._id;
    await payment.save();

    // Send confirmation email to researcher
    await researchEmail
      .sendProposalSubmitted({
        email: req.researcher.email,
        name: req.researcher.name || req.researcher.firstName,
        proposalTitle: newResearch.title,
        mpesaReceipt: payment.mpesaReceiptNumber,
        amount: payment.amount,
      })
      .catch((err) => console.error("Email error:", err));

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

    if (research.researcher.toString() !== req.researcher._id.toString()) {
      return res.status(403).json({
        message: "You can only submit papers for your own research",
      });
    }

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

    const finalPaperFile = req.files?.finalPaperFile
      ? `/uploads/research/${req.files.finalPaperFile[0].filename}`
      : null;

    if (!finalPaperFile) {
      return res.status(400).json({ message: "Final paper file is required" });
    }

    research.finalAbstract = finalAbstract || research.abstract;
    research.keywords = keywords || [];
    research.finalPaperFile = finalPaperFile;
    research.stage = "final_paper";
    research.status = "pending";
    research.updatedAt = new Date();

    await research.save();

    await researchEmail
      .sendProposalSubmitted({
        email: req.researcher.email,
        name: req.researcher.name || req.researcher.firstName,
        proposalTitle: research.title,
        mpesaReceipt: "N/A",
        amount: "N/A",
      })
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

exports.publishResearch = async (req, res) => {
  try {
    const research = await Research.findById(req.params.id);

    if (!research) {
      return res.status(404).json({ message: "Research not found" });
    }

    if (research.isPublished) {
      return res.status(400).json({ message: "Research is already published" });
    }

    if (research.stage !== "final_paper") {
      return res.status(400).json({
        message: `Only final papers can be published. Current stage: '${research.stage}'`,
      });
    }

    if (research.status !== "approved") {
      return res.status(400).json({
        message: "Research must be approved before publishing",
      });
    }

    // The pre("save") hook will also flip isPublished = true,
    // but we set it explicitly here so publishedAt is recorded.
    research.isPublished = true;
    research.publishedAt = new Date();
    await research.save();

    const researcher = await Researcher.findById(research.researcher);
    if (researcher) {
      await researchEmail
        .sendProposalApproved({
          email: researcher.email,
          name: researcher.firstName || researcher.name,
          proposalTitle: research.title,
          stage: "final_paper",
          reviewerComment:
            "Congratulations! Your paper has been published on the Nyahururu platform.",
        })
        .catch((err) => console.error("Publish email error:", err));
    }

    res.json({
      message: "Research published successfully",
      research: {
        id: research._id,
        title: research.title,
        isPublished: research.isPublished,
        publishedAt: research.publishedAt,
      },
    });
  } catch (error) {
    console.error("Publish research error:", error);
    res.status(500).json({ message: error.message });
  }
};

//ADMIN SECTION - Research management by admin users
// get all research papers no isPublished filter
exports.getAllResearchAdmin = async (req, res) => {
  try {
    const { stage, status, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (stage) filter.stage = stage;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { abstract: { $regex: search, $options: "i" } },
      ];
    }

    const [papers, total] = await Promise.all([
      Research.find(filter)
        .select(
          "title abstract category stage status isPublished " +
            "researcher fileUrl proposalFile finalPaperFile thumbnailUrl " +
            "downloadPrice downloads reviewComment createdAt updatedAt",
        )
        .populate("researcher", "name institution email")
        .populate("assignedReviewer", "name firstName lastName email institution")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Research.countDocuments(filter),
    ]);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      research: papers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

//Admin assign reviewer to research proposal

exports.assignReviewer = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Reviewer email is required" });
    }

    const research = await Research.findById(req.params.id);
    if (!research) {
      return res.status(404).json({ message: "Research not found" });
    }

    // Reviewers and admins are stored in the Researcher collection
    const reviewer = await Researcher.findOne({
      email: email.toLowerCase().trim(),
      role: { $in: ["reviewer", "admin", "superadmin"] },
    });

    if (!reviewer) {
      return res.status(404).json({
        message: "No reviewer or admin found with that email address",
      });
    }

    research.assignedReviewer = reviewer._id;
    research.assignedAt = new Date();
    await research.save();

    // Notify the assigned reviewer
    await researchEmail
      .sendNewProposalToReview({
        email: reviewer.email,
        name: reviewer.firstName || reviewer.name,
        proposalTitle: research.title,
        stage: research.stage,
        researcherName:
          reviewer.name || `${reviewer.firstName} ${reviewer.lastName}`,
        reviewLink: `${process.env.FRONTEND_URL}/hmis`,
      })
      .catch((err) => console.error("Assign reviewer email error:", err));

    res.json({
      message: `${reviewer.firstName || reviewer.name} assigned as reviewer successfully`,
      research: {
        id: research._id,
        title: research.title,
        assignedReviewer: {
          id: reviewer._id,
          name: reviewer.name || `${reviewer.firstName} ${reviewer.lastName}`,
          email: reviewer.email,
        },
      },
    });
  } catch (error) {
    console.error("Assign reviewer error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete research (admin only)

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
