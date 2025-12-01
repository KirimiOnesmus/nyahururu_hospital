const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  division: {
    type: String,
    enum: ["Outpatient", "Inpatient"],
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: [
      "General Medicine",
      "Internal Medicine",
      "Paediatrics",
      "Obstetrics and Gynecology",
      "Dentistry",
      "Ophthalmology",
      "ENT",
      "Surgery",
      "Orthopedics",
      "Radiology",
      "Laboratory",
      "Pharmacy",
      "Physiotherapy",
      "Mental Health",
      "Dermatology",
      "Emergency",
      "Others",
    ],
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  headOfDepartment: {
    type: String,
    trim: true,
  },
  contactInfo: {
    type: String,
    trim: true,
  },
  serviceHours: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  tariffInfo: {
    type: String,
  },
  nhifCovered: {
    type: Boolean,
    default: false,
    index: true,
  },
  imageUrl: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
serviceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Service", serviceSchema);
