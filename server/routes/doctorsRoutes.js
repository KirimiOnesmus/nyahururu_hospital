
const express = require('express');
const router = express.Router();
const {updateDoctorProfile,updateAvailability,toggleAvailability, getAllDoctors,getDoctorById} = require('../controllers/doctorController');
const { verifyToken  } = require('../middleware/auth');

// Doctor profile routes (protected - for doctors only)
router.put('/doctor/profile', verifyToken,updateDoctorProfile);
router.put('/doctor/availability', verifyToken, updateAvailability);
router.put('/doctor/toggle-availability', verifyToken, toggleAvailability);

// Public routes (anyone can view)
router.get('/doctors', getAllDoctors);
router.get('/doctors/:id', getDoctorById);

module.exports = router; 