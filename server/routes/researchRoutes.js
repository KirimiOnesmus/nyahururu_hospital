const express = require("express");
const upload  = require("../middleware/upload");
const router  = express.Router();

const researchController = require("../controllers/researchController");
const mpesaController    = require("../controllers/mpesaController");

const { 
  protectEither, 
  protectResearcher, 
  verifyToken, 
  authorizeRoles 
} = require("../middleware/auth");

const uploader = upload("research");
const uploadFields = uploader.fields([
  { name: "proposal", maxCount: 1 },
  { name: "paper",    maxCount: 1 },
  { name: "pdf",      maxCount: 1 },
]);



// Public: Get all published research
router.get("/", researchController.getAllResearch);

// Public: Get research by ID
router.get("/:id", researchController.getResearchById);


// Researcher: Initiate proposal submission (triggers M-Pesa payment)
router.post(
  "/proposals",
  protectResearcher,
  researchController.initiateProposalSubmission
);

// Researcher: Confirm proposal after payment succeeds
router.post(
  "/proposals/confirm",
  protectResearcher,
  uploadFields,
  researchController.confirmProposalSubmission
);

// Researcher: Submit final paper (FREE - no payment)
router.post(
  "/:researchId/final-paper",
  protectResearcher,
  uploadFields,
  researchController.submitFinalPaper
);

// Researcher: View revenue from own research downloads
router.get(
  "/:id/revenue-share",
  protectResearcher,
  researchController.getResearcherRevenue
);



// Admin: Set download price for research
router.patch(
  "/:id/download-price",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  researchController.updateDownloadPrice
);

// Admin: Update research metadata
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  uploadFields,
  researchController.updateResearch
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  researchController.deleteResearch
);


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
     
    }
    next();
  },
  mpesaController.initiateSTKPush
);

// Public: Verify payment status
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
   
    }
    next();
  },
  mpesaController.verifyPayment
);

// Public: M-Pesa callback endpoint (Daraja posts here)
router.post("/mpesa/callback", mpesaController.mpesaCallback);



// Admin: View revenue for a specific research
router.get(
  "/admin/research/:researchId/revenue",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  mpesaController.getResearchRevenue
);

// Admin: View all research revenue (dashboard)
router.get(
  "/admin/revenue",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  mpesaController.getAllResearchRevenue
);

// Admin: Refund a payment
router.post(
  "/admin/payments/refund",
  verifyToken,
  authorizeRoles("admin", "superadmin"),
  mpesaController.refundPayment
);


router.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({ 
      message: `Upload error: ${err.message}`,
      field: err.field
    });
  }
  next(err);
});

module.exports = router;