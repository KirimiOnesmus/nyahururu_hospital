const express = require('express');
const router = express.Router();
const {
  updateDoctorProfile,
  updateAvailability,
  toggleAvailability,
  getAllDoctors,
  getDoctorById,
  getDoctorsByDepartment 
} = require('../controllers/doctorController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');


router.put('/doctor/profile', verifyToken, authorizeRoles('doctor'), updateDoctorProfile);
router.put('/availability', verifyToken, authorizeRoles('doctor'), updateAvailability);
router.put('/toggle-availability', verifyToken, authorizeRoles('doctor'), toggleAvailability);

router.get('/doctors', getAllDoctors);
router.get('/doctors/:id', getDoctorById);

router.get('/doctors/department/:department', getDoctorsByDepartment);

module.exports = router;