const express = require("express");
const router = express.Router();
const {
  getBidsByTender,
  getBidById,
  createBid,
  updateBid,
  updateBidStatus,
  scoreBid,
  addComment,
  deleteBid,
  getVendorBids,
} = require("../controllers/bidController");

const { verifyToken, authorizeRoles } = require("../middleware/auth");
const createUploader = require("../middleware/upload");

const upload = createUploader("bids");

// Vendor routes
router.get("/my-bids", getVendorBids);
router.post("/", upload.array("documents", 10), createBid); // Submit bid
router.put("/:id", upload.array("documents", 10), updateBid); // Update own bid

// Admin/Manager routes
router.get("/tender/:tenderId", verifyToken,authorizeRoles("admin"), getBidsByTender);
router.get("/:id", getBidById);
router.patch("/:id/status", verifyToken,authorizeRoles("admin"), updateBidStatus);
router.patch("/:id/score", verifyToken,authorizeRoles("admin"), scoreBid);
router.post("/:id/comment", verifyToken,authorizeRoles("admin"), addComment);
router.delete("/:id",verifyToken,authorizeRoles("admin"), deleteBid);

module.exports = router;
