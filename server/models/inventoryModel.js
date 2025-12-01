const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Medicine', 'Equipment', 'Consumable', 'Other'],
      default: 'Other',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      // Examples: "pcs", "boxes", "bottles", "tablets", "ml", "grams"
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    supplier: {
      type: String,
      trim: true,
    },
    batch: {
      type: String,
      trim: true,
    },
    expiry: {
      type: Date,
      default: null,
    },
    minThreshold: {
      type: Number,
      default: 5,
      description: 'Minimum stock level before alert',
    },
    description: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    lastRestocked: {
      type: Date,
      default: Date.now,
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
  {
    timestamps: true,
  }
);

// Index for faster searches
inventorySchema.index({ name: 'text', category: 'text', supplier: 'text' });
inventorySchema.index({ expiry: 1 });
inventorySchema.index({ quantity: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);