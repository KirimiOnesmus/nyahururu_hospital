const express = require('express');
const router = express.Router();
const {
  updateDoctorProfile,
  updateAvailability,
  toggleAvailability,
  getAllDoctors,
  getDoctorById,
  getDoctorsByDepartment // NEW: Import new controller
} = require('../controllers/doctorController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Doctor profile routes (protected - for doctors only)
// M-3: route-level authorizeRoles added as a backstop — enforcement was
// already correct via requireDoctorForUser() inside the controller, but
// every other role-gated route file in this project uses authorizeRoles
// as the first line of defense, and a future controller edit that drops
// the inline check would otherwise have no route-level backup.
router.put('/doctor/profile', verifyToken, authorizeRoles('doctor'), updateDoctorProfile);
router.put('/availability', verifyToken, authorizeRoles('doctor'), updateAvailability);
router.put('/toggle-availability', verifyToken, authorizeRoles('doctor'), toggleAvailability);

// Public routes (anyone can view)
router.get('/doctors', getAllDoctors);
router.get('/doctors/:id', getDoctorById);

// NEW: Get doctors by department
router.get('/doctors/department/:department', getDoctorsByDepartment);

module.exports = router;