"use strict";

const express = require("express");
const router = express.Router();

const {
  bookAppointment,
  getAllAppointments,
  getPendingAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  getBookedSlots,
} = require("../controllers/appointmentController");

const { verifyToken, authorizeRoles } = require("../middleware/auth");

router.post("/", bookAppointment);

// Public — needed by the booking form to grey-out taken slots
router.get("/booked-slots", getBookedSlots);

router.get("/", verifyToken, authorizeRoles("admin", "doctor"), getAllAppointments);
router.get("/pending", verifyToken, authorizeRoles("admin", "doctor"), getPendingAppointments);
router.get("/doctor/:doctorId", verifyToken, authorizeRoles("doctor"), getDoctorAppointments);

router.put("/:id", verifyToken, authorizeRoles("doctor", "admin"), updateAppointmentStatus);
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteAppointment);

module.exports = router;
