const Appointment = require("../models/appointmentModel");
const Doctor = require("../models/doctorModel");
const emailService = require("../utils/emailServices");
const smsServices = require("../utils/smsServices");

exports.bookAppointment = async (req, res) => {
  try {
    const { name, email, phone, service, department, date, time } = req.body;

    if (!name || !email || !service || !date || !time)
      return res.status(400).json({ message: "All fields are required" });

    const appointment = await Appointment.create({
      patientName: name,
      patientEmail: email,
      service,
      department,
      phone,
      appointmentDate: date,
      time,
    });

    // Send confirmation emails
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
    const filter = {};

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
    const appointments = await Appointment.find(filter).sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    if (req.user.role === "doctor" && req.user._id.toString() !== doctorId) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these appointments" });
    }

    const appointments = await Appointment.find({ doctorId }).sort({
      date: -1,
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
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const allowedTransitions = {
      Pending: ["Confirmed", "Cancelled"],
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

    // Send status update email
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
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
