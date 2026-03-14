const Report = require('../models/reportModel');
const path = require('path');
const fs = require('fs').promises;

// Get all reports with filters
exports.getAllReports = async (req, res) => {
  try {
    const { search, category, status, period, sortBy = 'newest' } = req.query;

    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    if (period && period !== 'all') filter.period = period;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let query = Report.find(filter).populate('uploadedBy', 'name email');

    if (sortBy === 'newest') query = query.sort({ createdAt: -1 });
    if (sortBy === 'oldest') query = query.sort({ createdAt: 1 });
    if (sortBy === 'mostViewed') query = query.sort({ views: -1 });
    if (sortBy === 'mostDownloaded') query = query.sort({ downloads: -1 });

    const reports = await query.lean();

    // Calculate stats
    const stats = {
      total: await Report.countDocuments(),
      published: await Report.countDocuments({ status: 'published' }),
      draft: await Report.countDocuments({ status: 'draft' }),
      archived: await Report.countDocuments({ status: 'archived' }),
      thisMonth: await Report.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    };

    res.status(200).json({
      success: true,
      data: reports,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message,
    });
  }
};

// Get single report
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('comments.commentedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Increment views
    report.views += 1;
    await report.save();

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message,
    });
  }
};

// Create new report
exports.createReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File is required',
      });
    }

    const { title, category, type, period, customStartDate, customEndDate, description, status, tags } = req.body;

    if (!title || !category || !period) {
      // Delete uploaded file if validation fails
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Title, category, and period are required',
      });
    }

    const reportData = {
      title,
      category,
      type: type || getFileType(req.file.originalname),
      period,
      customStartDate: period === 'Custom' ? customStartDate : undefined,
      customEndDate: period === 'Custom' ? customEndDate : undefined,
      description,
      status: status || 'draft',
      fileUrl: `/uploads/reports/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    };

    const report = await Report.create(reportData);

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: report,
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({
      success: false,
      message: 'Error creating report',
      error: error.message,
    });
  }
};

// Update report
exports.updateReport = async (req, res) => {
  try {
    const { title, category, type, period, customStartDate, customEndDate, description, status, tags } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Check authorization
    if (report.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report',
      });
    }

    // Handle file replacement
    if (req.file) {
      const oldFilePath = path.join(__dirname, '../..', 'public', report.fileUrl);
      await fs.unlink(oldFilePath).catch(() => {});

      report.fileUrl = `/uploads/reports/${req.file.filename}`;
      report.fileName = req.file.originalname;
      report.fileSize = req.file.size;
      report.type = type || getFileType(req.file.originalname);
    }

    if (title) report.title = title;
    if (category) report.category = category;
    if (type) report.type = type;
    if (period) report.period = period;
    if (description !== undefined) report.description = description;
    if (status) report.status = status;
    if (customStartDate && period === 'Custom') report.customStartDate = customStartDate;
    if (customEndDate && period === 'Custom') report.customEndDate = customEndDate;
    if (tags) report.tags = tags.split(',').map(tag => tag.trim());

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report,
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({
      success: false,
      message: 'Error updating report',
      error: error.message,
    });
  }
};

// Delete report
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Check authorization
    if (report.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this report',
      });
    }

    // Delete file
    const filePath = path.join(__dirname, '../..', 'public', report.fileUrl);
    await fs.unlink(filePath).catch(() => {});

    await Report.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message,
    });
  }
};

// Download report
exports.downloadReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Increment downloads
    report.downloads += 1;
    await report.save();

    const filePath = path.join(__dirname, '../..', 'public', report.fileUrl);

    res.download(filePath, report.fileName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error downloading report',
      error: error.message,
    });
  }
};

// Get reports by category
exports.getReportsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { status = 'published' } = req.query;

    const reports = await Report.find({ category, status })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reports by category',
      error: error.message,
    });
  }
};

// Add comment to report
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    report.comments.push({
      text,
      commentedBy: req.user.id,
      commentedByName: req.user.name,
    });

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message,
    });
  }
};

// Bulk delete reports
exports.bulkDeleteReports = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide report IDs',
      });
    }

    const reports = await Report.find({ _id: { $in: ids } });

    for (const report of reports) {
      // Check authorization
      if (report.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete one or more reports',
        });
      }

      // Delete files
      const filePath = path.join(__dirname, '../..', 'public', report.fileUrl);
      await fs.unlink(filePath).catch(() => {});
    }

    await Report.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${ids.length} report(s) deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting reports',
      error: error.message,
    });
  }
};

// Helper function to detect file type
function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'excel';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (ext === 'zip') return 'zip';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
  return 'pdf';
}