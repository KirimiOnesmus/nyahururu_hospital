const express = require("express");
const router = express.Router();
const {
  bookAppointment,
  getAllAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  deleteAppointment,
} = require("../controllers/appointmentController");

const { verifyToken, authorizeRoles } = require("../middleware/auth");

router.post("/", bookAppointment);

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  getAllAppointments,
);

router.get(
  "/pending",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  async (req, res) => {
    try {
      const Appointment = require("../models/appointmentModel");
      const filter = { status: "Pending" };

      if (req.user.role === "doctor") {
        const Doctor = require("../models/doctorModel");
        const doctorProfile = await Doctor.findOne({ userId: req.user._id });

        if (!doctorProfile || !doctorProfile.department) {
          return res
            .status(400)
            .json({ message: "No department assigned to this doctor" });
        }
        filter.department = doctorProfile.department;
      }

      const appointments = await Appointment.find(filter).sort({
        createdAt: -1,
      });
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

router.get(
  "/doctor/:doctorId",
  verifyToken,
  authorizeRoles("doctor"),
  getDoctorAppointments,
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("doctor", "admin"),
  updateAppointmentStatus,
);

router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteAppointment);

module.exports = router;
