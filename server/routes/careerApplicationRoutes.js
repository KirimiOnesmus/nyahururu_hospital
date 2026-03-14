const express = require("express");
const router = express.Router();
const {
  submitApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  getApplicationsByJob
} = require("../controllers/careerApplicationController");

const { verifyToken, authorizeRoles } = require("../middleware/auth");

// Public: submit a new application
router.post("/", submitApplication);

// Admin: get all applications (optionally filter by career)
router.get("/", verifyToken, authorizeRoles("admin"), getAllApplications);

// Admin: get single application by ID
router.get("/:id", verifyToken, authorizeRoles("admin"), getApplicationById);

// Admin: get applications for a specific job
router.get("/job/:careerId", verifyToken, authorizeRoles("admin"), getApplicationsByJob);


// Admin: update application status (e.g., pending, reviewed, accepted, rejected)
router.put("/:id/status", verifyToken, authorizeRoles("admin"), updateApplicationStatus);

// Admin: delete an application
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteApplication);

module.exports = router;
