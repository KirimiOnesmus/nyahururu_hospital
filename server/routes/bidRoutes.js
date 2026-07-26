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


router.get("/my-bids", verifyToken, authorizeRoles("vendor"), getVendorBids);
router.post("/", verifyToken, authorizeRoles("vendor"), upload.array("documents", 10), createBid);
router.put("/:id", verifyToken, authorizeRoles("vendor"), upload.array("documents", 10), updateBid);

router.get("/:id", verifyToken, authorizeRoles("vendor", "admin"), getBidById);


router.get("/tender/:tenderId", verifyToken, authorizeRoles("admin", "it"), getBidsByTender);
router.patch("/:id/status", verifyToken, authorizeRoles("admin","it"), updateBidStatus);
router.patch("/:id/score", verifyToken, authorizeRoles("admin", "it"), scoreBid);
router.post("/:id/comment", verifyToken, authorizeRoles("admin","it"), addComment);
router.delete("/:id", verifyToken, authorizeRoles("vendor", "admin"), deleteBid);

module.exports = router;
