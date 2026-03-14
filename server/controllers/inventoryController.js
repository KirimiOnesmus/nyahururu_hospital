const Inventory = require('../models/inventoryModel');

exports.getAllInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(inventory);
  } catch (error) {
    console.error('Get all inventory error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get inventory by ID
exports.getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get inventory by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create inventory item
exports.createInventory = async (req, res) => {
  try {
    const { name, category, quantity, unit, price, supplier, batch, expiry, minThreshold, sku, description } = req.body;

    // Validate required fields
    if (!name || !category || quantity === undefined || !unit || price === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: name, category, quantity, unit, price',
      });
    }

    // Check if SKU already exists
    if (sku) {
      const existingSku = await Inventory.findOne({ sku });
      if (existingSku) {
        return res.status(400).json({ message: 'SKU already exists' });
      }
    }

    const newItem = await Inventory.create({
      name,
      category,
      quantity,
      unit,
      price,
      supplier,
      batch,
      expiry: expiry ? new Date(expiry) : null,
      minThreshold: minThreshold || 5,
      sku,
      description,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    res.status(201).json({
      message: 'Inventory item created successfully',
      item: newItem,
    });
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update inventory item
exports.updateInventory = async (req, res) => {
  try {
    const { name, category, quantity, unit, price, supplier, batch, expiry, minThreshold, sku, description } = req.body;

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Check if new SKU already exists (and is different from current)
    if (sku && sku !== item.sku) {
      const existingSku = await Inventory.findOne({ sku });
      if (existingSku) {
        return res.status(400).json({ message: 'SKU already exists' });
      }
    }

    // Update fields
    if (name !== undefined) item.name = name;
    if (category !== undefined) item.category = category;
    if (quantity !== undefined) item.quantity = quantity;
    if (unit !== undefined) item.unit = unit;
    if (price !== undefined) item.price = price;
    if (supplier !== undefined) item.supplier = supplier;
    if (batch !== undefined) item.batch = batch;
    if (expiry !== undefined) item.expiry = expiry ? new Date(expiry) : null;
    if (minThreshold !== undefined) item.minThreshold = minThreshold;
    if (sku !== undefined) item.sku = sku;
    if (description !== undefined) item.description = description;

    item.updatedBy = req.user?.id;
    item.lastRestocked = new Date();

    const updatedItem = await item.save();

    res.json({
      message: 'Inventory item updated successfully',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete inventory item
exports.deleteInventory = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get low stock items
exports.getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.find({
      $expr: { $lt: ['$quantity', '$minThreshold'] },
    }).sort({ quantity: 1 });

    res.json(items);
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get expired items
exports.getExpiredItems = async (req, res) => {
  try {
    const now = new Date();
    const items = await Inventory.find({
      expiry: { $lte: now },
    }).sort({ expiry: 1 });

    res.json(items);
  } catch (error) {
    console.error('Get expired items error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get items expiring soon (within 30 days)
exports.getExpiringItems = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const items = await Inventory.find({
      expiry: { $gte: now, $lte: thirtyDaysFromNow },
    }).sort({ expiry: 1 });

    res.json(items);
  } catch (error) {
    console.error('Get expiring items error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get inventory statistics
exports.getInventoryStats = async (req, res) => {
  try {
    const total = await Inventory.countDocuments();
    const byCategory = await Inventory.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const lowStock = await Inventory.countDocuments({
      $expr: { $lt: ['$quantity', '$minThreshold'] },
    });
    const expired = await Inventory.countDocuments({
      expiry: { $lte: new Date() },
    });

    res.json({
      total,
      byCategory,
      lowStock,
      expired,
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Search inventory
exports.searchInventory = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const items = await Inventory.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { supplier: { $regex: query, $options: 'i' } },
        { sku: { $regex: query, $options: 'i' } },
      ],
    });

    res.json(items);
  } catch (error) {
    console.error('Search inventory error:', error);
    res.status(500).json({ message: error.message });
  }
};
