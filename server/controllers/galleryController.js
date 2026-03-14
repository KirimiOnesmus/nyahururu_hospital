const Gallery = require('../models/galleryModel');
const GalleryCategory = require('../models/galleryCategoryModel');
const fs = require('fs');
const path = require('path');

// Get all gallery items
exports.getAllGallery = async (req, res) => {
  try {
    const { category, type, visible, search, sort = '-uploadDate' } = req.query;

    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (visible !== undefined) {
      query.visible = visible === 'true';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const items = await Gallery.find(query)
      .populate('uploadedBy', 'name email')
      .sort(sort);

    res.json(items);
  } catch (error) {
    console.error('Get all gallery error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get gallery item by ID
exports.getGalleryById = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id).populate('uploadedBy', 'name email');

    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    // Increment views
    item.views += 1;
    await item.save();

    res.json(item);
  } catch (error) {
    console.error('Get gallery by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create gallery item
exports.createGallery = async (req, res) => {
  try {
    const { title, description, category, tags, visible } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        message: 'Missing required fields: title and category',
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Determine file type
    const mimeType = req.file.mimetype;
    const fileType = mimeType.startsWith('image') ? 'image' : 'video';

    const fileUrl = `/uploads/gallery/${req.file.filename}`;

    const gallery = await Gallery.create({
      title,
      description,
      type: fileType,
      category,
      fileUrl,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      visible: visible !== false,
      uploadedBy: req.user?.id,
    });

    res.status(201).json({
      message: 'Gallery item uploaded successfully',
      item: gallery,
    });
  } catch (error) {
    console.error('Create gallery error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update gallery item
exports.updateGallery = async (req, res) => {
  try {
    const { title, description, category, tags, visible } = req.body;

    const item = await Gallery.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (category !== undefined) item.category = category;
    if (tags !== undefined) item.tags = tags.split(',').map(t => t.trim());
    if (visible !== undefined) item.visible = visible;

    const updatedItem = await item.save();

    res.json({
      message: 'Gallery item updated successfully',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Update gallery error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete gallery item
exports.deleteGallery = async (req, res) => {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    // Delete file from server
    if (item.fileUrl) {
      const filePath = path.join(__dirname, '../public', item.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ message: 'Gallery item deleted successfully' });
  } catch (error) {
    console.error('Delete gallery error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Bulk delete
exports.bulkDeleteGallery = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Invalid IDs provided' });
    }

    const items = await Gallery.find({ _id: { $in: ids } });

    // Delete files
    items.forEach(item => {
      if (item.fileUrl) {
        const filePath = path.join(__dirname, '../public', item.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    await Gallery.deleteMany({ _id: { $in: ids } });

    res.json({ message: `${ids.length} item(s) deleted successfully` });
  } catch (error) {
    console.error('Bulk delete gallery error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Toggle visibility
exports.toggleVisibility = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    item.visible = !item.visible;
    await item.save();

    res.json({
      message: `Gallery item is now ${item.visible ? 'visible' : 'hidden'}`,
      item,
    });
  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Like gallery item
exports.likeGallery = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    item.likes += 1;
    await item.save();

    res.json({ message: 'Item liked', likes: item.likes });
  } catch (error) {
    console.error('Like gallery error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get gallery stats
exports.getGalleryStats = async (req, res) => {
  try {
    const total = await Gallery.countDocuments();
    const images = await Gallery.countDocuments({ type: 'image' });
    const videos = await Gallery.countDocuments({ type: 'video' });
    const visible = await Gallery.countDocuments({ visible: true });
    const hidden = await Gallery.countDocuments({ visible: false });

    const categories = await Gallery.distinct('category');
    const recentItems = await Gallery.find()
      .sort({ uploadDate: -1 })
      .limit(7)
      .countDocuments();

    res.json({
      total,
      images,
      videos,
      visible,
      hidden,
      categories: categories.length,
      recentItems,
    });
  } catch (error) {
    console.error('Get gallery stats error:', error);
    res.status(500).json({ message: error.message });
  }
};