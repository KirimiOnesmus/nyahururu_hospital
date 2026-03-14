const express = require("express");
const router = express.Router();
const {
    registerDonor,
    getAllDonors,
    updateDonor,
    updateDonorStatus,
    deleteDonor,
    getDonorsByBloodGroup,
    getUpcomingDonations, 
    getDonationStats,
} = require("../controllers/bloodDonorController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

// Public routes
router.post("/register",  registerDonor);

// Get specific donor (public - for donors to check their status)
//router.get("/donor/:donorId", donorController.getDonor);

// Protected routes (admin/staff only)
router.get("/", verifyToken, authorizeRoles('admin', 'staff'), getAllDonors);

router.put("/:donorId", verifyToken, authorizeRoles('admin'), updateDonor);

router.patch(
  "/:donorId/status",
  verifyToken,
  authorizeRoles('admin', 'staff'),
  updateDonorStatus
);

router.delete("/:donorId", verifyToken, authorizeRoles('admin'), deleteDonor);

// Statistics and reporting routes
router.get(
  "/blood-group/:bloodGroup",
  verifyToken,
  authorizeRoles('admin','staff'),
  getDonorsByBloodGroup
);

router.get(
  "/schedule/upcoming",
  verifyToken,
  authorizeRoles('admin', 'staff'),
  getUpcomingDonations
);

router.get(
  "/reports/statistics",
  verifyToken,
 authorizeRoles('admin'),
  getDonationStats
);

module.exports = router;
