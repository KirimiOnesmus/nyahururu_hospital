const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getAllAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  deleteAppointment
} = require('../controllers/appointmentController');

const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.post('/', bookAppointment);

router.get('/', verifyToken, authorizeRoles('admin'), getAllAppointments);

router.get('/doctor/:doctorId', verifyToken, authorizeRoles('doctor'), getDoctorAppointments);

router.put('/:id', verifyToken, authorizeRoles('doctor', 'admin'), updateAppointmentStatus);

router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteAppointment);

module.exports = router;
