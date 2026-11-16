const express = require("express");
const router = express.Router();
const {
  createUrgentRequest,
  getAllUrgentRequests,
  getActiveUrgentRequests,
  updateUrgentRequest,
  toggleUrgentRequestStatus,
  deleteUrgentRequest,
} = require("../controllers/UrgentRequest"); 
const { verifyToken, authorizeRoles } = require("../middleware/auth");


router.get("/active", getActiveUrgentRequests);


router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "blood_donation"),
  createUrgentRequest
);

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "superadmin", "blood_donation"),
  getAllUrgentRequests
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "blood_donation"),
  updateUrgentRequest
);

router.patch(
  "/:id/toggle",
  verifyToken,
  authorizeRoles("admin", "blood_donation"),
  toggleUrgentRequestStatus
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  deleteUrgentRequest
);

module.exports = router;
