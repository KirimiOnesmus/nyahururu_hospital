const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },

  name: { type: String, trim: true }, // auto combined

  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: [
      "superadmin",
      "admin",
      "doctor",
      "staff",
      "it",
      "nurse",
      "pharmacist",
      "communication",
    ],
    default: "staff",
  },

  department: { type: String },
  position: { type: String },
  phone: { type: String },
  bloodGroup: { type: String },
  expiryDate: { type: Date },
  signatureText: { type: String },
  dateOfBirth: { type: Date },
  joinDate: { type: Date },
  profileImage: { type: String },
  signature: { type: String },
  employeeId: { type: String, unique: true }, 
  rfidTag: { type: String, unique: true },    

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
