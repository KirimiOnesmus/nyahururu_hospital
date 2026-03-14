const express = require("express");
const router = express.Router();
const {
  createAnonymousAppointment,
  getAllAnonymousAppointments,
  getAnonymousAppointmentByCaseCode,
  updateAppointmentStatus,
  deleteAnonymousAppointment,
  getAppointmentStats
} = require("../controllers/anonymousController");
const { verifyToken, authorizeRoles } = require('../middleware/auth');
// Public Route
router.post("/", createAnonymousAppointment);

// PROTECTED ROUTES - STAFF/ADMIN ONLY


router.use(verifyToken);
router.use(authorizeRoles('admin', 'staff', 'doctor', 'nurse'));


// Private (Staff/Admin)
router.get("/stats/overview", getAppointmentStats);


// Private (Staff/Admin)
router.get("/", getAllAnonymousAppointments);


// Private (Staff/Admin)
router.get("/:case_code", getAnonymousAppointmentByCaseCode);


//  Private (Staff/Admin)
router.patch("/:case_code/status", updateAppointmentStatus);

router.delete("/:case_code", authorizeRoles('admin'), deleteAnonymousAppointment);

module.exports = router;