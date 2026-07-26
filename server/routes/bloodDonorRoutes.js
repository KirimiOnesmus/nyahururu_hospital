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


router.get("/", verifyToken, authorizeRoles('admin', 'staff','it'), getAllDonors);

router.put("/:donorId", verifyToken, authorizeRoles('admin', 'it'), updateDonor);

router.patch(
  "/:donorId/status",
  verifyToken,
  authorizeRoles('admin', 'staff'),
  updateDonorStatus
);

router.delete("/:donorId", verifyToken, authorizeRoles('admin', 'it'), deleteDonor);


router.get(
  "/blood-group/:bloodGroup",
  verifyToken,
  authorizeRoles('admin','staff', 'it'),
  getDonorsByBloodGroup
);

router.get(
  "/schedule/upcoming",
  verifyToken,
  authorizeRoles('admin', 'staff', 'it'),
  getUpcomingDonations
);

router.get(
  "/reports/statistics",
  verifyToken,
 authorizeRoles('admin', 'it'),
  getDonationStats
);

module.exports = router;
