"use strict";

const { Appointment, Doctor } = require("../sequelize/models");
const emailService = require("../utils/emailServices");

const smsServices = null; // Africa's Talking SMS integration removed.
                          // If SMS notifications are re-introduced, plug
                          // the new provider in here — the appointment
                          // callsites remain in place (commented out).

exports.bookAppointment = async (req, res) => {
  try {
    const { name, email, phone, service, department, date, time } = req.body;

    if (!name || !email || !service || !date || !time) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const appointment = await Appointment.create({
      patientName: name,
      patientEmail: email,
      service,
      department,
      phone,
      appointmentDate: date,
      time,
    });

    const appointmentData = {
      patientName: name,
      patientEmail: email,
      department,
      service,
      appointmentDate: date,
      time,
      phone,
    };

    emailService
      .sendAppointmentConfirmationEmail(appointmentData)
      .catch((err) =>
        console.error("Failed to send appointment confirmation email:", err),
      );

    // if (phone) {
    //   smsServices.sendAppointmentConfirmation(appointmentData)
    //     .catch(err => console.error('Failed to send appointment confirmation SMS:', err));
    // }

    res.status(201).json({
      message: "Appointment booked successfully. Await confirmation.",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const where = {};

    if (req.user.role === "doctor") {
      // For doctors, scope the list to their own department. The Doctor
      // row is the source of truth for department assignment — it may
      // legitimately differ from user.department in edge cases (a
      // doctor whose user.department was set but doctor row was never
      // synced), and the doctor row is what appointment intake uses.
      const doctorProfile = await Doctor.findOne({ where: { userId: req.user.id } });
      if (!doctorProfile || !doctorProfile.department) {
        return res.status(400).json({ message: "No department assigned to this doctor" });
      }
      where.department = doctorProfile.department;
    }

    const appointments = await Appointment.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/appointments/pending
// Same department-scoping as getAllAppointments, but filtered to
// status=Pending. Was previously implemented inline in
// routes/appointmentRoutes.js as a Mongoose call — moved here so all
// data access goes through the Sequelize controller layer and can be
// unit-tested + reused. The route file now just delegates.
exports.getPendingAppointments = async (req, res) => {
  try {
    const where = { status: "Pending" };

    if (req.user.role === "doctor") {
      const doctorProfile = await Doctor.findOne({ where: { userId: req.user.id } });
      if (!doctorProfile || !doctorProfile.department) {
        return res.status(400).json({ message: "No department assigned to this doctor" });
      }
      where.department = doctorProfile.department;
    }

    const appointments = await Appointment.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    // req.user.id is a numeric primary key now, not an ObjectId — String()
    // coerces both sides for a safe equality check without .toString().
    if (req.user.role === "doctor" && String(req.user.id) !== String(doctorId)) {
      return res.status(403).json({ message: "Not authorized to view these appointments" });
    }

    const appointments = await Appointment.findAll({
      where: { doctorId },
      order: [["appointmentDate", "DESC"]],
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const normalizedStatus =
      status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const allowedTransitions = {
      Pending:   ["Confirmed", "Cancelled"],
      Confirmed: ["Completed"],
      Cancelled: [],
      Completed: [],
    };

    if (
      appointment.status !== normalizedStatus &&
      !allowedTransitions[appointment.status]?.includes(normalizedStatus)
    ) {
      return res.status(400).json({
        message: `Cannot change status from ${appointment.status} to ${normalizedStatus}`,
      });
    }

    appointment.status = normalizedStatus;
    await appointment.save();

    const appointmentData = {
      patientName: appointment.patientName,
      service: appointment.service,
      appointmentDate: appointment.appointmentDate,
      time: appointment.time,
    };

    emailService
      .sendAppointmentStatusUpdateEmail(
        appointment.patientEmail,
        appointmentData,
        normalizedStatus,
      )
      .catch((err) =>
        console.error("Failed to send status update email:", err),
      );

    // if (appointment.phone) {
    //   smsServices
    //     .sendAppointmentStatusUpdate(
    //       appointment.phone,
    //       appointment.patientName,
    //       appointment.service,
    //       appointment.appointmentDate,
    //       appointment.time,
    //       status
    //     )
    //     .catch((err) =>
    //       console.error("Failed to send status update SMS:", err)
    //     );
    // }

    res.json({ message: `Appointment ${status}`, appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    await appointment.destroy();
    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
