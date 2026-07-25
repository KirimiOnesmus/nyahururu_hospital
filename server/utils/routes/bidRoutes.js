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

// C5: these previously had no auth middleware at all even though
// createBid/updateBid/getVendorBids read req.user.id/req.user.name — they
// either 500'd on every call or (worse, if req.user was ever set by a
// stray upstream middleware) allowed unauthenticated bid
// submission/tampering. Now all vendor-scoped routes require a real
// 'vendor' staff-role token; ownership checks inside the controller
// (bid.vendorId === req.user.id) are the second layer.

// Vendor routes
router.get("/my-bids", verifyToken, authorizeRoles("vendor"), getVendorBids);
router.post("/", verifyToken, authorizeRoles("vendor"), upload.array("documents", 10), createBid);
router.put("/:id", verifyToken, authorizeRoles("vendor"), upload.array("documents", 10), updateBid);

// Read a single bid: owning vendor or admin only (ownership check lives in
// the controller since authorizeRoles alone can't know bid ownership).
router.get("/:id", verifyToken, authorizeRoles("vendor", "admin"), getBidById);

// Admin/Manager routes
router.get("/tender/:tenderId", verifyToken, authorizeRoles("admin"), getBidsByTender);
router.patch("/:id/status", verifyToken, authorizeRoles("admin"), updateBidStatus);
router.patch("/:id/score", verifyToken, authorizeRoles("admin"), scoreBid);
router.post("/:id/comment", verifyToken, authorizeRoles("admin"), addComment);
router.delete("/:id", verifyToken, authorizeRoles("vendor", "admin"), deleteBid);

module.exports = router;
