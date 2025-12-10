const Appointment = require("../models/appointmentModel");
const Doctor = require("../models/doctorModel");
const emailService = require("../utils/emailServices");
const smsServices = require("../utils/smsServices");

exports.bookAppointment = async (req, res) => {
  try {
    const { name, email, phone, service, date, time } = req.body;

    if (!name || !email || !service || !date || !time)
      return res.status(400).json({ message: "All fields are required" });

    const appointment = await Appointment.create({
      patientName: name,
      patientEmail: email,
      service,
      phone,
      appointmentDate: date,
      time,
    });

    
    console.log('Controller - Created appointment:', appointment);


    // Send confirmation emails
    const appointmentData = {
      patientName: name,
      patientEmail: email,
      service,
      appointmentDate: date,
      time,
      phone,
    };
    console.log('Controller - Appointment data for SMS:', appointmentData)


        emailService.sendAppointmentConfirmationEmail(appointmentData)
      .catch(err => console.error('Failed to send appointment confirmation email:', err));


    if (phone) {
      smsServices.sendAppointmentConfirmation(appointmentData)
        .catch(err => console.error('Failed to send appointment confirmation SMS:', err));
    }

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
    const appointments = await Appointment.find().sort({ createdAt: -1 });
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
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = status;
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
        status
      )
      .catch((err) =>
        console.error("Failed to send status update email:", err)
      );

    if (appointment.phone) {
      smsServices
        .sendAppointmentStatusUpdate(
          appointment.phone,
          appointment.patientName,
          appointment.service,
          appointment.appointmentDate,
          appointment.time,
          status
        )
        .catch((err) =>
          console.error("Failed to send status update SMS:", err)
        );
    }

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
