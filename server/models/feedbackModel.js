const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  message: { type: String, required: true },
  status: { type: String, default: 'pending' }, 
  response: { type: String },
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  respondedByName: { type: String }, 
  respondedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
