const Notice = require('../models/noticeModel');
const fs = require('fs');
const path = require('path');

// Get all notices
exports.getAllNotices = async (req, res) => {
  try {
    const { category, audience, status, search, sort = '-createdAt' } = req.query;

    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (audience && audience !== 'all') {
      query.audience = audience;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const notices = await Notice.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sort);

    res.json(notices);
  } catch (error) {
    console.error('Get all notices error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get notice by ID
exports.getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    // Increment views
    notice.views += 1;
    await notice.save();

    res.json(notice);
  } catch (error) {
    console.error('Get notice by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create notice
exports.createNotice = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      audience,
      startDate,
      startTime,
      endDate,
      endTime,
      visible,
      sendNotification,
    } = req.body;

    if (!title || !content || !category || !audience || !startDate) {
      return res.status(400).json({
        message: 'Missing required fields: title, content, category, audience, startDate',
      });
    }

    const notice = await Notice.create({
      title,
      content,
      category,
      audience,
      startDate: new Date(startDate),
      startTime: startTime || '00:00',
      endDate: endDate ? new Date(endDate) : null,
      endTime: endTime || '23:59',
      visible: visible !== false,
      sendNotification: sendNotification || false,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    res.status(201).json({
      message: 'Notice created successfully',
      notice,
    });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update notice
exports.updateNotice = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      audience,
      startDate,
      startTime,
      endDate,
      endTime,
      visible,
      sendNotification,
    } = req.body;

    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    if (title !== undefined) notice.title = title;
    if (content !== undefined) notice.content = content;
    if (category !== undefined) notice.category = category;
    if (audience !== undefined) notice.audience = audience;
    if (startDate !== undefined) notice.startDate = new Date(startDate);
    if (startTime !== undefined) notice.startTime = startTime;
    if (endDate !== undefined) notice.endDate = endDate ? new Date(endDate) : null;
    if (endTime !== undefined) notice.endTime = endTime;
    if (visible !== undefined) notice.visible = visible;
    if (sendNotification !== undefined) notice.sendNotification = sendNotification;

    notice.updatedBy = req.user?.id;

    const updatedNotice = await notice.save();

    res.json({
      message: 'Notice updated successfully',
      notice: updatedNotice,
    });
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete notice
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    // Delete attached files
    if (notice.attachments && notice.attachments.length > 0) {
      notice.attachments.forEach(attachment => {
        const filePath = path.join(__dirname, '../public', attachment.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Bulk delete
exports.bulkDeleteNotices = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Invalid IDs provided' });
    }

    const notices = await Notice.find({ _id: { $in: ids } });

    // Delete attached files
    notices.forEach(notice => {
      if (notice.attachments && notice.attachments.length > 0) {
        notice.attachments.forEach(attachment => {
          const filePath = path.join(__dirname, '../public', attachment.fileUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
    });

    await Notice.deleteMany({ _id: { $in: ids } });

    res.json({ message: `${ids.length} notice(s) deleted successfully` });
  } catch (error) {
    console.error('Bulk delete notices error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Toggle visibility
exports.toggleVisibility = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    notice.visible = !notice.visible;
    await notice.save();

    res.json({
      message: `Notice is now ${notice.visible ? 'visible' : 'hidden'}`,
      notice,
    });
  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Upload attachment
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    notice.attachments.push({
      fileName: req.file.originalname,
      fileUrl: `/uploads/notices/${req.file.filename}`,
    });

    await notice.save();

    res.json({
      message: 'Attachment uploaded successfully',
      notice,
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete attachment
exports.deleteAttachment = async (req, res) => {
  try {
    const { attachmentIndex } = req.body;
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    if (attachmentIndex < 0 || attachmentIndex >= notice.attachments.length) {
      return res.status(400).json({ message: 'Invalid attachment index' });
    }

    const attachment = notice.attachments[attachmentIndex];
    const filePath = path.join(__dirname, '../public', attachment.fileUrl);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    notice.attachments.splice(attachmentIndex, 1);
    await notice.save();

    res.json({ message: 'Attachment deleted successfully', notice });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Duplicate notice
exports.duplicateNotice = async (req, res) => {
  try {
    const originalNotice = await Notice.findById(req.params.id);

    if (!originalNotice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    const newNotice = await Notice.create({
      title: `${originalNotice.title} (Copy)`,
      content: originalNotice.content,
      category: originalNotice.category,
      audience: originalNotice.audience,
      startDate: new Date(),
      startTime: originalNotice.startTime,
      endDate: null,
      endTime: originalNotice.endTime,
      visible: false,
      sendNotification: false,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      message: 'Notice duplicated successfully',
      notice: newNotice,
    });
  } catch (error) {
    console.error('Duplicate notice error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get notice statistics
exports.getNoticeStats = async (req, res) => {
  try {
    const total = await Notice.countDocuments();
    const active = await Notice.countDocuments({ status: 'active' });
    const scheduled = await Notice.countDocuments({ status: 'scheduled' });
    const expired = await Notice.countDocuments({ status: 'expired' });
    const hidden = await Notice.countDocuments({ status: 'hidden' });

    res.json({
      total,
      active,
      scheduled,
      expired,
      hidden,
    }); 
  } catch (error) {
    console.error('Get notice stats error:', error);
    res.status(500).json({ message: error.message });
  }
};
