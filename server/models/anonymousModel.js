const mongoose = require("mongoose");
const { Schema } = mongoose;

const anonymousAppointmentSchema = new Schema({
case_code: {
    type: String,
    unique: true,
    required: true
  },

  case_type: {
    type: String,
    enum: ["GBV", "Mental Health"],
    required: true
  },

  contact_method: {
    type: String,
    enum: ["phone", "in_person"],
    required: true
  },

  contact_value: {
    type: String, // phone number OR null
    default: null
  },

  safe_to_contact: {
    type: Boolean,
    default: true
  },

  preferred_date: {
    type: Date,
    default: null
  },

  preferred_time: {
    type: String, // e.g. "10:00 AM", "3:30 PM"
    default: null
  },

  asap: {
    type: Boolean,
    default: false
  },

  reason: {
    type: String,
    default: null
  },

  status: {
    type: String,
    enum: ["pending", "approved", "in_progress", "completed", "cancelled"],
    default: "pending"
  },

  created_at: {
    type: Date,
    default: Date.now
  }
});



module.exports = mongoose.model("AnonymousAppointment", anonymousAppointmentSchema);