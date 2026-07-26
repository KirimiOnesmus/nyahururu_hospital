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

router.post('/create', createAmbulanceBooking);

router.get('/', verifyToken, authorizeRoles('admin', 'it'), getAllAmbulanceBookings);


router.get('/my-bookings', verifyToken, getUserBookings);

router.get('/status/:status', verifyToken, authorizeRoles('admin','it'), getBookingsByStatus);


router.put('/:id/status', verifyToken, authorizeRoles('admin', 'it'), updateBookingStatus);


router.put('/:id/cancel', verifyToken, cancelBooking);


router.get('/:id', verifyToken, getAmbulanceBookingById);

module.exports = router;