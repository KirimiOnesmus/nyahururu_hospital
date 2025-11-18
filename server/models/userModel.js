const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
  name: { type: String, required: true ,trim: true},
  email: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, 
    enum: ['superadmin','admin', 'doctor', 'staff', 'it', 'nurse', 'pharmacist', 'communication', ], 
    default: 'staff' },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', userSchema);