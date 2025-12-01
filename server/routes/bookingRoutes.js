const express = require('express');
const bookingRouter = express.Router(); 
const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  getPendingBookings,
  getUrgentBookings,
  getBookingStats,
} = require('../controllers/bookingController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Public routes (can make public if needed)
bookingRouter.get('/', getAllBookings);
bookingRouter.get('/stats', getBookingStats);
bookingRouter.get('/pending', getPendingBookings);
bookingRouter.get('/urgent', getUrgentBookings);
bookingRouter.get('/:id', getBookingById);

// Protected routes
bookingRouter.post('/', verifyToken, createBooking);
bookingRouter.put('/:id', verifyToken, updateBooking);
bookingRouter.delete('/:id', verifyToken, authorizeRoles('admin'), deleteBooking);

module.exports = bookingRouter;