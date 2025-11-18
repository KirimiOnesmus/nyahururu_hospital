const Appointment = require('../models/appointmentModel');
const Doctor = require('../models/doctorModel');

exports.bookAppointment = async (req, res) => {
  try {
    const { name, email, phone, service, date, time } = req.body;
   
if (!name || !email || !service || !date || !time)
  return res.status(400).json({ message: 'All fields are required' });

    const appointment = await Appointment.create({
      patientName: name,
      patientEmail: email,
      service,
      phone,
      appointmentDate:date,
      time,
    });

    res.status(201).json({
      message: 'Appointment booked successfully. Await confirmation.',
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


    if (req.user.role === 'doctor' && req.user._id.toString() !== doctorId) {
      return res.status(403).json({ message: 'Not authorized to view these appointments' });
    }

    const appointments = await Appointment.find({ doctorId }).sort({ date: -1 });
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
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

    res.json({ message: `Appointment ${status}`, appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
