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

router.post("/", createAnonymousAppointment);

router.use(verifyToken);
router.use(authorizeRoles('admin', 'staff', 'doctor', 'nurse'));

router.get("/stats/overview", getAppointmentStats);

router.get("/", getAllAnonymousAppointments);

router.get("/:case_code", getAnonymousAppointmentByCaseCode);

router.patch("/:case_code/status", updateAppointmentStatus);

router.delete("/:case_code", authorizeRoles('admin'), deleteAnonymousAppointment);

module.exports = router;