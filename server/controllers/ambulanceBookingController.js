const Vehicle = require('../models/vehicleModel');
const AmbulanceBooking = require('../models/ambulanceBookingModel');

exports.createAmbulanceBooking = async (req, res) => {
  try {
    const {
      patientName,
      phone,
      email,
      currentLocation,
      destinationHospital,
      emergencyLevel,
      medicalCondition,
      additionalNotes,
    } = req.body;

    // Validate required fields
    if (!patientName || !phone || !currentLocation || !medicalCondition || !emergencyLevel) {
      return res.status(400).json({
        message: 'Missing required fields: patientName, phone, currentLocation, medicalCondition, emergencyLevel',
      });
    }

    // Validate phone number
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      return res.status(400).json({
        message: 'Invalid phone number format',
      });
    }

    // Create booking
    const booking = await AmbulanceBooking.create({
      patientName,
      phone,
      email: email || null,
      currentLocation,
      destinationHospital: destinationHospital || 'Not specified',
      emergencyLevel,
      medicalCondition,
      additionalNotes: additionalNotes || null,
      status: 'Pending',
      bookingDate: new Date(),
      userId: req.user?.id || null,
    });

    // Find an available ambulance and assign it
    const availableAmbulance = await Vehicle.findOne({
      status: 'Available',
      type: { $in: ['Ambulance', 'ambulance'] },
    });

    if (availableAmbulance) {
      // Update booking with vehicle
      booking.vehicleId = availableAmbulance._id;
      booking.status = 'Assigned';
      booking.assignedAt = new Date();

      // Update vehicle status to "In Use" (valid enum value from Vehicle model)
      availableAmbulance.status = 'In Use';
      availableAmbulance.updatedBy = req.user?.id || null;
      await availableAmbulance.save();

      await booking.save();
    } else {
      // No ambulance available
      booking.status = 'Waiting';
      await booking.save();
    }

    res.status(201).json({
      message: availableAmbulance
        ? 'Ambulance booked successfully. Dispatch team will contact you shortly.'
        : 'Your request has been registered. Awaiting available ambulance.',
      booking,
      ambulance: availableAmbulance || null,
    });
  } catch (error) {
    console.error('Create ambulance booking error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAmbulanceBookings = async (req, res) => {
  try {
    const bookings = await AmbulanceBooking.find()
      .populate('vehicleId', 'plate type driver mileage')
      .populate('userId', 'name email')
      .sort({ bookingDate: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAmbulanceBookingById = async (req, res) => {
  try {
    const booking = await AmbulanceBooking.findById(req.params.id)
      .populate('vehicleId', 'plate type driver mileage make model')
      .populate('userId', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await AmbulanceBooking.find({ userId: req.user.id })
      .populate('vehicleId', 'plate type driver')
      .sort({ bookingDate: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Assigned', 'In Transit', 'Arrived', 'Completed', 'Cancelled', 'Waiting'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const booking = await AmbulanceBooking.findByIdAndUpdate(
      req.params.id,
      {
        status,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate('vehicleId', 'plate type driver');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // If completed, mark vehicle as available again
    if (status === 'Completed' && booking.vehicleId) {
      await Vehicle.findByIdAndUpdate(booking.vehicleId, {
        status: 'Available',
        updatedBy: req.user?.id,
      });
    }

    res.json({
      message: 'Booking status updated successfully',
      booking,
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await AmbulanceBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (['Completed', 'Cancelled'].includes(booking.status)) {
      return res.status(400).json({
        message: `Cannot cancel a ${booking.status.toLowerCase()} booking`,
      });
    }

    // Release vehicle if assigned
    if (booking.vehicleId) {
      await Vehicle.findByIdAndUpdate(booking.vehicleId, {
        status: 'Available',
        updatedBy: req.user?.id,
      });
    }

    booking.status = 'Cancelled';
    booking.cancelledAt = new Date();
    booking.cancelReason = req.body.reason || 'User cancelled';
    await booking.save();

    res.json({
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getBookingsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['Pending', 'Assigned', 'In Transit', 'Arrived', 'Completed', 'Cancelled', 'Waiting'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const bookings = await AmbulanceBooking.find({ status })
      .populate('vehicleId', 'plate type driver')
      .sort({ bookingDate: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings by status error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;