const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    unique: true
  },
  phone: { 
    type: String,
    trim: true
  },
  address: { 
    type: String,
    trim: true
  },
  imageUrl: { 
    type: String,
    default: null
  },

  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});



module.exports = mongoose.model('Profile', profileSchema);