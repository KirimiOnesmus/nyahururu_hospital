const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    plate: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['Ambulance', 'Service Van', 'Delivery Truck', 'Staff Transport'],
    },
    status: {
      type: String,
      enum: ['Available', 'In Use', 'Maintenance'],
      default: 'Available',
    },
    driver: {
      type: String,
      trim: true,
    },
    lastService: {
      type: Date,
      default: null,
    },
    nextService: {
      type: Date,
      default: null,
    },
    mileage: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      trim: true,
    },
    make: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
    },
    registrationExpiry: {
      type: Date,
    },
    insuranceExpiry: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Index for searches
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ type: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);