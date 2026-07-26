const emitChange = require("../utils/emitChange");
"use strict";

const { Op } = require("sequelize");
const { Appointment, Doctor } = require("../sequelize/models");
const logger = require("../utils/logger");
const emailService = require("../utils/emailServices");

const smsServices = null; // Africa's Talking SMS integration removed.
                          

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
    emitChange("appointments", "created", { id: appointment.id });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const where = {};

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
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};



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
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;


    if (req.user.role === "doctor" && String(req.user.id) !== String(doctorId)) {
      return res.status(403).json({ message: "Not authorized to view these appointments" });
    }

    const appointments = await Appointment.findAll({
      where: { doctorId },
      order: [["appointmentDate", "DESC"]],
    });
    res.json(appointments);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
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
    emitChange("appointments", "updated", { id: appointment.id, status });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    await appointment.destroy();
    res.json({ message: "Appointment deleted successfully" });
    emitChange("appointments", "deleted", { id: req.params.id });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};


exports.getBookedSlots = async (req, res) => {
  try {
    const { date, service } = req.query;

    if (!date || !service) {
      return res.status(400).json({ message: "Both 'date' and 'service' query params are required" });
    }

    const appointments = await Appointment.findAll({
      where: {
        appointmentDate: date,
        service,
        status: { [Op.in]: ["Pending", "Confirmed"] },
      },
      attributes: ["time"],
    });

    const bookedSlots = appointments.map((a) => a.time);
    res.json({ date, service, bookedSlots });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};
