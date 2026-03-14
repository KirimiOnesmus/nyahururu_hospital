const express = require('express');
const router = express.Router();
const {
  createAmbulanceBooking,
  getAllAmbulanceBookings,
  getAmbulanceBookingById,
  getUserBookings,
  updateBookingStatus,
  cancelBooking,
  getBookingsByStatus,
} = require('../controllers/ambulanceBookingController');

const { verifyToken, authorizeRoles } = require('../middleware/auth');

// ========== POST ROUTES ==========
router.post('/create', createAmbulanceBooking);

// ========== GET ROUTES - SPECIFIC PATHS FIRST ==========
// Get all bookings (admin only)
router.get('/', verifyToken, authorizeRoles('admin'), getAllAmbulanceBookings);

// Get user's bookings
router.get('/my-bookings', verifyToken, getUserBookings);

// Get bookings by status (admin only)
router.get('/status/:status', verifyToken, authorizeRoles('admin'), getBookingsByStatus);

// ========== PUT ROUTES - WITH ACTION NAMES ==========
// Update booking status (admin only)
router.put('/:id/status', verifyToken, authorizeRoles('admin'), updateBookingStatus);

// Cancel booking
router.put('/:id/cancel', verifyToken, cancelBooking);

// ========== GET :id ROUTE - MUST BE LAST ==========
router.get('/:id', getAmbulanceBookingById);

module.exports = router;