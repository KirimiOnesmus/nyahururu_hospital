const express = require("express");
const router = express.Router();
const {
  createUrgentRequest,
  getAllUrgentRequests,
  getActiveUrgentRequests,
  updateUrgentRequest,
  toggleUrgentRequestStatus,
  deleteUrgentRequest,
} = require("../controllers/UrgentRequest"); // Fixed: removed space
const { verifyToken, authorizeRoles } = require("../middleware/auth");

// PUBLIC route - get active urgent requests
router.get("/active", getActiveUrgentRequests);

// PROTECTED routes - admin/staff only
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "staff"),
  createUrgentRequest
);

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "staff"),
  getAllUrgentRequests
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "staff"),
  updateUrgentRequest
);

router.patch(
  "/:id/toggle",
  verifyToken,
  authorizeRoles("admin", "staff"),
  toggleUrgentRequestStatus
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  deleteUrgentRequest
);

module.exports = router;