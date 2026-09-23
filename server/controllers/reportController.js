"use strict";

const fs = require("fs").promises;
const { Op } = require("sequelize");
const { Report, User, sequelize } = require("../sequelize/models");
const { resolveUploadPath } = require("../utils/safePath");


const SORT_MAP = {
  newest:        [["createdAt", "DESC"]],
  oldest:        [["createdAt", "ASC"]],
  mostViewed:    [["views", "DESC"]],
  mostDownloaded:[["downloads", "DESC"]],
};

const UPLOADER_INCLUDE = [
  { model: User, as: "uploader", attributes: ["id", "name", "email"] },
];

const STAFF_REPORT_ROLES = ["admin", "it", "superadmin"];
const isStaffViewer = (req) =>
  !!(req.user && STAFF_REPORT_ROLES.includes(req.user.role));

const canModify = (report, user) =>
  String(report.uploadedBy) === String(user.id) || user.role === "admin";

const reportDiskPath = (report) => resolveUploadPath(report.fileUrl);

const safeUnlink = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {

    if (err.code !== "ENOENT") {
      console.error("Failed to remove report file:", filePath, err);
    }
  }
};


function getFileType(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["xlsx", "xls", "csv"].includes(ext)) return "excel";
  if (["doc", "docx"].includes(ext)) return "word";
  if (ext === "zip") return "zip";
  if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "image";
  return "pdf";
}



exports.getAllReports = async (req, res) => {
  try {
    const { search, category, status, period, sortBy = "newest" } = req.query;
    const staff = isStaffViewer(req);

    const where = {};
    if (category && category !== "all") where.category = category;
    if (staff && status && status !== "all") where.status = status;
    if (!staff) where.status = "published";
    if (period && period !== "all") where.period = period;

    if (search) {
      const escaped = String(search).replace(/[\\%_]/g, (m) => `\\${m}`);
      const like = `%${escaped}%`;
      where[Op.or] = [
        { title: { [Op.like]: like } },
        { description: { [Op.like]: like } },

        sequelize.literal(
          "JSON_SEARCH(tags, 'one', " +
            sequelize.escape(like) +
            ") IS NOT NULL",
        ),
      ];
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const uploaderInclude = staff
      ? UPLOADER_INCLUDE
      : [{ model: User, as: "uploader", attributes: ["id", "name"] }];

    const [reports, total, published, draft, archived, thisMonth] = await Promise.all([
      Report.findAll({
        where,
        include: uploaderInclude,
        order: SORT_MAP[sortBy] || SORT_MAP.newest,
      }),
      staff ? Report.count() : Report.count({ where: { status: "published" } }),
      Report.count({ where: { status: "published" } }),
      staff ? Report.count({ where: { status: "draft" } }) : Promise.resolve(0),
      staff ? Report.count({ where: { status: "archived" } }) : Promise.resolve(0),
      Report.count({
        where: staff
          ? { createdAt: { [Op.gte]: thirtyDaysAgo } }
          : { status: "published", createdAt: { [Op.gte]: thirtyDaysAgo } },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: reports,
      stats: staff
        ? { total, published, draft, archived, thisMonth }
        : { total: published, published, thisMonth },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching reports",
    });
  }
};

exports.getReportById = async (req, res) => {
  try {

    const report = await sequelize.transaction(async (t) => {
      const r = await Report.findByPk(req.params.id, {
        include: isStaffViewer(req)
          ? UPLOADER_INCLUDE
          : [{ model: User, as: "uploader", attributes: ["id", "name"] }],
        transaction: t,
      });
      if (!r) return null;
      if (r.status !== "published" && !isStaffViewer(req)) return { forbidden: true };
      r.views = (r.views || 0) + 1;
      await r.save({ transaction: t });
      return r;
    });

    if (!report || report.forbidden) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching report",
    });
  }
};

exports.createReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    const {
      title, category, type, period,
      customStartDate, customEndDate,
      description, status, tags,
    } = req.body;

    if (!title || !category || !period) {
       await safeUnlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Title, category, and period are required",
      });
    }

    const reportData = {
      title,
      category,
      type: type || getFileType(req.file.originalname),
      period,
      customStartDate: period === "Custom" ? customStartDate : null,
      customEndDate:   period === "Custom" ? customEndDate   : null,
      description,
      status: status || "draft",
      fileUrl: `/uploads/reports/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
      tags: tags ? String(tags).split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      comments: [],
    };

    const report = await Report.create(reportData);

    res.status(201).json({
      success: true,
      message: "Report created successfully",
      data: report,
    });
  } catch (error) {
    if (req.file) await safeUnlink(req.file.path);
    res.status(500).json({
      success: false,
      message: "Error creating report",
    });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const {
      title, category, type, period,
      customStartDate, customEndDate,
      description, status, tags,
    } = req.body;

    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    if (!canModify(report, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this report",
      });
    }

  
    if (req.file) {
      await safeUnlink(reportDiskPath(report));

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
    if (customStartDate && period === "Custom") report.customStartDate = customStartDate;
    if (customEndDate   && period === "Custom") report.customEndDate   = customEndDate;
    if (tags) {
      report.tags = String(tags).split(",").map((tag) => tag.trim()).filter(Boolean);
    }

    await report.save();

    res.status(200).json({
      success: true,
      message: "Report updated successfully",
      data: report,
    });
  } catch (error) {
    if (req.file) await safeUnlink(req.file.path);
    res.status(500).json({
      success: false,
      message: "Error updating report",
    });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    if (!canModify(report, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this report",
      });
    }

    await safeUnlink(reportDiskPath(report));
    await report.destroy();

    res.status(200).json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting report",
    });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }
    if (report.status !== "published" && !isStaffViewer(req)) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const filePath = reportDiskPath(report);

    try {
      await Report.increment("downloads", { where: { id: report.id } });
    } catch (err) {
      console.error("Failed to increment download counter:", err);
    }

    res.download(filePath, report.fileName, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ success: false, message: "File not found on disk" });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error downloading report",
    });
  }
};

exports.getReportsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const staff = isStaffViewer(req);
    const { status = "published" } = req.query;
    const where = { category, status: staff ? status : "published" };

    const reports = await Report.findAll({
      where,
      include: staff
        ? UPLOADER_INCLUDE
        : [{ model: User, as: "uploader", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching reports by category",
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

  
    await report.addComment(text, req.user);

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding comment",
    });
  }
};

exports.bulkDeleteReports = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide report IDs",
      });
    }

    const reports = await Report.findAll({ where: { id: { [Op.in]: ids } } });


    for (const report of reports) {
      if (!canModify(report, req.user)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete one or more reports",
        });
      }
    }

    for (const report of reports) {
      await safeUnlink(reportDiskPath(report));
    }

    const deleted = await Report.destroy({ where: { id: { [Op.in]: ids } } });

    res.status(200).json({
      success: true,
      message: `${deleted} report(s) deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting reports",
    });
  }
};
