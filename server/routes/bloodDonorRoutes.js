const express = require("express");
const router = express.Router();
const {
    registerDonor,
    getAllDonors,
    updateDonor,
    updateDonorStatus,
    deleteDonor,
    getUpcomingDonations, 
    getDonationStats,
    registerOfficeWalkIn,
    getDonorScreening,
    getDonationAvailability,
} = require("../controllers/bloodDonorController");
const { verifyToken } = require("../middleware/auth");
const { AppError } = require("../utils/appError");

// IT does not need donor records. Superadmin may read the restricted directory
// for oversight, while donation-office staff/admin alone may operate workflows.
const authorizeBloodDonorReader = (req, res, next) => {
    if (!["admin", "superadmin", "blood_donation"].includes(req.user?.role)) {
        return next(new AppError("Blood donor records are restricted to authorized donation staff.", 403));
    }
    return next();
};

const authorizeBloodDonorStaff = (req, res, next) => {
    if (!["admin", "blood_donation"].includes(req.user?.role)) {
        return next(new AppError("Blood donor records are restricted to authorized donation staff.", 403));
    }
    return next();
};

const authorizeBloodDonationOffice = (req, res, next) => {
    if (req.user?.role !== "blood_donation") {
        return next(new AppError("Only blood donation office accounts can access donor screening details.", 403));
    }
    return next();
};

const authorizeBloodDonorAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return next(new AppError("Only an administrator can delete donor records.", 403));
    }
    return next();
};

// Public routes
router.post("/register",  registerDonor);
router.get("/availability", getDonationAvailability);

router.post("/office-register", verifyToken, authorizeBloodDonationOffice, registerOfficeWalkIn);


router.get("/", verifyToken, authorizeBloodDonorReader, getAllDonors);

router.get("/:donorId/screening", verifyToken, authorizeBloodDonationOffice, getDonorScreening);

router.put("/:donorId", verifyToken, authorizeBloodDonorStaff, updateDonor);

router.patch(
  "/:donorId/status",
  verifyToken,
  authorizeBloodDonorStaff,
  updateDonorStatus
);

router.delete("/:donorId", verifyToken, authorizeBloodDonorAdmin, deleteDonor);


router.get(
  "/schedule/upcoming",
  verifyToken,
  authorizeBloodDonorReader,
  getUpcomingDonations
);

router.get(
  "/reports/statistics",
  verifyToken,
 authorizeBloodDonorReader,
  getDonationStats
);

module.exports = router;
