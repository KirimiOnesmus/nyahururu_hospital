const express = require("express");
const upload = require("../middleware/upload");
const router = express.Router();
const researchController = require("../controllers/researchController");
const mpesaController = require("../controllers/mpesaController");
const reviewerController = require("../controllers/reviewerController");

const {
  protectEither,
  protectResearcher,
  protectReviewers,
  verifyToken,
  authorizeRoles,
} = require("../middleware/auth");

const uploader = upload("research");
const uploadFields = uploader.fields([
  { name: "proposal", maxCount: 1 },
  { name: "proposalFile", maxCount: 1 },
  { name: "paper", maxCount: 1 },
  { name: "finalPaperFile", maxCount: 1 },
  { name: "pdf", maxCount: 1 },
]);

// PUBLIC ENDPOINTS

router.get("/", researchController.getAllPublishedResearch);

//REVIER ROUTES
router.get(
  "/reviewer/assigned",
  protectReviewers,
  async (req, res) => {
    try {
      const Research = require("../models/researchModel");
      const { stage, search, page = 1, limit = 20 } = req.query;

      // Build filter - research assigned to this reviewer
      const reviewerId = req.researcher?._id || req.user?._id;
      const filter = { assignedReviewer: reviewerId };

      if (stage && stage !== "all") {
        filter.stage = stage;
      }

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { abstract: { $regex: search, $options: "i" } },
        ];
      }

      // Fetch with pagination
      const [queue, total] = await Promise.all([
        Research.find(filter)
          .populate(
            "researcher",
            "name firstName lastName email institution discipline",
          )
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit)),
        Research.countDocuments(filter),
      ]);

      // Transform response for frontend
      const formattedQueue = queue.map((item) => ({
        id: item._id,
        title: item.title,
        stage: item.stage,
        status: item.status,
        abstract: item.abstract,
        submittedAt: item.createdAt,
        author:
          item.researcher?.name ||
          `${item.researcher?.firstName} ${item.researcher?.lastName}`,
        institution: item.researcher?.institution,
        discipline: item.researcher?.discipline,
        reviewer: item.assignedReviewer,
      }));

      res.json({
        total,
        page: Number(page),
        limit: Number(limit),
        queue: formattedQueue,
      });
    } catch (error) {
      console.error("Fetch assigned research error:", error);
      res.status(500).json({ message: error.message });
    }
  },
);

router.get(
  "/reviewer/stats",
   protectReviewers,
  async (req, res) => {
    try {
      const Research = require("../models/researchModel");
      const reviewerId = req.researcher?._id || req.user?._id;

      const [assigned, completed, approved, rejected] = await Promise.all([
        Research.countDocuments({
          assignedReviewer: reviewerId,
          status: "pending",
        }),
        Research.countDocuments({
          reviewedBy: reviewerId,
        }),
        Research.countDocuments({
          reviewedBy: reviewerId,
          status: "approved",
        }),
        Research.countDocuments({
          reviewedBy: reviewerId,
          status: "rejected",
        }),
      ]);

      res.json({
        stats: {
          assigned,
          completed,
          approved,
          rejected,
        },
      });
    } catch (error) {
      console.error("Fetch reviewer stats error:", error);
      res.status(500).json({ message: error.message });
    }
  },
);

router.get(
  "/reviewer/history",
   protectReviewers,  
  async (req, res) => {
    try {
      const Research = require("../models/researchModel");
      const { page = 1, limit = 20, stage, status } = req.query;
      const reviewerId = req.researcher?._id || req.user?._id;

      const filter = {
        reviewedBy: reviewerId,
      };

      if (stage && stage !== "all") filter.stage = stage;
      if (status && status !== "all") filter.status = status;

      const [history, total] = await Promise.all([
        Research.find(filter)
          .select("title stage status reviewComment reviewedAt researcher")
          .populate("researcher", "name firstName lastName email institution")
          .sort({ reviewedAt: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit)),
        Research.countDocuments(filter),
      ]);

      res.json({
        total,
        page: Number(page),
        limit: Number(limit),
        history: history.map((item) => ({
          id: item._id,
          title: item.title,
          stage: item.stage,
          status: item.status,
          reviewComment: item.reviewComment,
          reviewedAt: item.reviewedAt,
          researcher: {
            name:
              item.researcher?.name ||
              `${item.researcher?.firstName} ${item.researcher?.lastName}`,
            email: item.researcher?.email,
            institution: item.researcher?.institution,
          },
        })),
      });
    } catch (error) {
      console.error("Fetch review history error:", error);
      res.status(500).json({ message: error.message });
    }
  },
);


router.get(
  "/reviews/pending",
  protectReviewers, 
  async (req, res) => {
    try {
      const Research = require("../models/researchModel");
      const { stage, search, page = 1, limit = 20 } = req.query;

      const filter = { status: "pending" };
      if (stage) filter.stage = stage;

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { abstract: { $regex: search, $options: "i" } },
        ];
      }

      const [queue, total] = await Promise.all([
        Research.find(filter)
          .populate("researcher", "name email institution discipline")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit)),
        Research.countDocuments(filter),
      ]);

      res.json({
        total,
        page: Number(page),
        limit: Number(limit),
        queue,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

router.post(
  "/:id/review",
  protectReviewers,
  async (req, res) => {
    try {
      const { decision, comment } = req.body;
      const Research = require("../models/researchModel");
      const Researcher = require("../models/ResearcherModel");
      const researchEmail = require("../utils/emailServices");

      if (!["approved", "rejected"].includes(decision)) {
        return res.status(400).json({ message: "Invalid decision" });
      }

      if (!comment || comment.trim().length < 10) {
        return res
          .status(400)
          .json({ message: "Comment must be at least 10 characters" });
      }

      const research = await Research.findById(req.params.id);
      if (!research) {
        return res.status(404).json({ message: "Research not found" });
      }

      if (research.status !== "pending") {
        return res.status(400).json({
          message: `Cannot review research with status: ${research.status}`,
        });
      }

      // Update research
      research.status = decision === "approved" ? "approved" : "rejected";
      research.reviewComment = comment;
      research.reviewedBy = req.researcher?._id || req.user?._id;
      research.reviewedAt = new Date();
      await research.save();

      // Get researcher and send notification
      const researcher = await Researcher.findById(research.researcher);
      if (researcher) {
        const stage = research.stage;
        const stageLabel = {
          proposal: "Stage 1 — Proposal",
          abstract: "Stage 2 — Abstract",
          final_paper: "Stage 3 — Final Paper",
        }[stage];

        if (decision === "approved") {
          await researchEmail.sendProposalApproved({
            email: researcher.email,
            name: researcher.firstName,
            proposalTitle: research.title,
            stage,
            reviewerComment: comment,
          });
        } else {
          await researchEmail.sendRevisionRequested({
            email: researcher.email,
            name: researcher.firstName,
            proposalTitle: research.title,
            stage,
            reviewerComment: comment,
          });
        }
      }

      res.json({
        message: `Proposal ${
          decision === "approved" ? "approved" : "rejected"
        } successfully`,
        research,
      });
    } catch (error) {
      console.error("Review submission error:", error);
      res.status(500).json({ message: error.message });
    }
  },
);



// ADMIN ROUTES
router.get(
  "/admin/all",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  researchController.getAllResearchAdmin,
);

// RESEARCHER ROUTES

router.get("/my-research", protectResearcher, async (req, res) => {
  try {
    const Research = require("../models/researchModel");
    const research = await Research.find({
      researcher: req.researcher._id,
    })
      .select(
        "title stage status submittedAt reviewedAt downloads reviewComment",
      )
      .sort({ createdAt: -1 });

    res.json({
      count: research.length,
      research,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get(
  "/:id/revenue-share",
  protectResearcher,
  researchController.getResearcherRevenue,
);

// PROPOSAL SUBMISSION ROUTES

router.post(
  "/proposals/initiate",
  async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        const jwt = require("jsonwebtoken");
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded.collection === "researchers") {
            const Researcher = require("../models/ResearcherModel");
            const researcher = await Researcher.findById(decoded.id);
            if (researcher) req.researcher = researcher;
          }
        } catch (err) {
          // Token invalid, continue without auth
        }
      }
      next();
    } catch (err) {
      next();
    }
  },
  researchController.initiateProposalSubmission,
);

//Verifies payment completed

router.post(
  "/proposals/confirm",
  protectResearcher,
  // uploadFields,
  uploader.any(),
  researchController.confirmProposalSubmission,
);

// PAYMENT ROUTES

router.post(
  "/mpesa/stk-push",
  async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.collection === "researchers") {
          const Researcher = require("../models/ResearcherModel");
          const researcher = await Researcher.findById(decoded.id);
          if (researcher) req.researcher = researcher;
        }
      }
    } catch (err) {
      // Token invalid, continue
    }
    next();
  },
  mpesaController.initiateSTKPush,
);

router.get(
  "/mpesa/verify/:checkoutRequestId",
  async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.collection === "researchers") {
          const Researcher = require("../models/ResearcherModel");
          const researcher = await Researcher.findById(decoded.id);
          if (researcher) req.researcher = researcher;
        }
      }
    } catch (err) {
      // Token invalid, continue
    }
    next();
  },
  mpesaController.verifyPayment,
);

router.post("/mpesa/callback", mpesaController.mpesaCallback);

//Publish research (Admin only)
router.patch(
  "/:id/publish",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  researchController.publishResearch,
);



// REVIEWER MANAGEMENT (Admin only)

router.post(
  "/reviewers/invite",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  reviewerController.inviteReviewer,
);

router.post("/reviewers/set-password", reviewerController.setPassword);

router.post(
  "/reviewers/:id/resend-invite",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  reviewerController.resendInvite,
);

router.get(
  "/reviewers",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  reviewerController.listReviewers,
);

router.get(
  "/reviewers/all",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  reviewerController.listAllReviewers,
);

router.patch(
  "/reviewers/:id/revoke",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  reviewerController.revokeReviewer,
);

router.patch(
  "/reviewers/:id/promote-admin",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  reviewerController.promoteToAdmin,
);

router.put(
  "/reviewers/:id",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  reviewerController.updateReviewer,
);

router.post(
  "/:id/assign-reviewer",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  researchController.assignReviewer,
);

router.get(
  "/:id/review-history",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const Research = require("../models/researchModel");
      const research = await Research.findById(req.params.id)
        .select(
          "title stage status reviewComment reviewedBy reviewedAt resubmissionCount",
        )
        .populate("reviewedBy", "name email");

      if (!research) {
        return res.status(404).json({ message: "Research not found" });
      }

      res.json({
        research,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ADMIN ENDPOINTS

router.get(
  "/admin/research/:researchId/revenue",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  mpesaController.getResearchRevenue,
);

router.get(
  "/admin/revenue",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  mpesaController.getAllResearchRevenue,
);

router.post(
  "/admin/payments/refund",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  mpesaController.refundPayment,
);

router.patch(
  "/:id/download-price",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  researchController.updateDownloadPrice,
);

// PARAMETERIZED ROUTES

router.get("/:id", researchController.getResearchById);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  researchController.deleteResearch,
);

// Error handling middleware
router.use((err, req, res, next) => {
  if (err.name === "MulterError") {
    return res.status(400).json({
      message: `Upload error: ${err.message}`,
      field: err.field,
    });
  }
  next(err);
});

module.exports = router;
