const mongoose = require('mongoose');

const ambulanceBookingSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    currentLocation: {
      type: String,
      required: true,
      trim: true,
    },
    destinationHospital: {
      type: String,
      trim: true,
      default: 'Not specified',
    },
    emergencyLevel: {
      type: String,
      enum: ['standard', 'urgent', 'critical'],
      default: 'standard',
    },
    medicalCondition: {
      type: String,
      required: true,
    },
    additionalNotes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Transit', 'Arrived', 'Completed', 'Cancelled', 'Waiting'],
      default: 'Pending',
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    assignedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    estimatedArrival: Date,
    actualArrival: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ambulanceBookingSchema.index({ status: 1 });
ambulanceBookingSchema.index({ bookingDate: -1 });
ambulanceBookingSchema.index({ userId: 1 });
ambulanceBookingSchema.index({ vehicleId: 1 });

module.exports = mongoose.model('AmbulanceBooking', ambulanceBookingSchema);