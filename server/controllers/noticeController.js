const emitChange = require("../utils/emitChange");
"use strict";

const fs = require("fs");
const logger = require("../utils/logger");
const path = require("path");
const { Op } = require("sequelize");
const { Notice, User, sequelize } = require("../sequelize/models");
const { getPagination, buildMeta } = require("../utils/pagination");


const SORTABLE_COLUMNS = new Set([
  "createdAt", "updatedAt", "startDate", "endDate", "title", "views",
]);
const parseSort = (raw) => {
  if (!raw) return [["createdAt", "DESC"]];
  const dir = raw.startsWith("-") ? "DESC" : "ASC";
  const col = raw.replace(/^-/, "");
  if (!SORTABLE_COLUMNS.has(col)) return [["createdAt", "DESC"]];
  return [[col, dir]];
};

const AUTHOR_INCLUDE = [
  { model: User, as: "creator", attributes: ["id", "name", "email"] },
  { model: User, as: "updater", attributes: ["id", "name", "email"] },
];

const attachmentDiskPath = (attachment) =>
  path.join(__dirname, "../public", attachment.fileUrl);

const safeUnlink = (filePath) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {

    console.error("Failed to remove attachment file:", filePath, err);
  }
};



exports.getAllNotices = async (req, res) => {
  try {
    const { category, audience, status, search, sort = "-createdAt" } = req.query;

    const where = {};
    if (category && category !== "all") where.category = category;
    if (audience && audience !== "all") where.audience = audience;
    if (status && status !== "all") where.status = status;


    if (search) {
      const escaped = String(search).replace(/[\\%_]/g, (m) => `\\${m}`);
      where[Op.or] = [
        { title: { [Op.like]: `%${escaped}%` } },
        { content: { [Op.like]: `%${escaped}%` } },
      ];
    }

    const { requestedPaging, page, limit, offset } = getPagination(req.query);
    const { rows: notices, count: total } = await Notice.findAndCountAll({
      where,
      include: AUTHOR_INCLUDE,
      order: parseSort(sort),
      limit,
      offset,
    });

    if (!requestedPaging) return res.json(notices);
    return res.json({ data: notices, meta: buildMeta(page, limit, total, notices.length, offset) });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getNoticeById = async (req, res) => {
  try {

    const notice = await sequelize.transaction(async (t) => {
      const n = await Notice.findByPk(req.params.id, {
        include: AUTHOR_INCLUDE,
        transaction: t,
      });
      if (!n) return null;
      n.views = (n.views || 0) + 1;
      await n.save({ transaction: t });
      return n;
    });

    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json(notice);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.createNotice = async (req, res) => {
  try {
    const {
      title, content, category, audience,
      startDate, startTime, endDate, endTime,
      visible, sendNotification,
    } = req.body;

    if (!title || !content || !category || !audience || !startDate) {
      return res.status(400).json({
        message: "Missing required fields: title, content, category, audience, startDate",
      });
    }


    const notice = await Notice.create({
      title,
      content,
      category,
      audience,
      startDate: new Date(startDate),
      startTime: startTime || "00:00",
      endDate: endDate ? new Date(endDate) : null,
      endTime: endTime || "23:59",
      visible: visible !== false,
      sendNotification: sendNotification || false,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
      attachments: [],
    });

    res.status(201).json({ message: "Notice created successfully", notice });
    emitChange("notices", "created", { id: notice.id, title: notice.title });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.updateNotice = async (req, res) => {
  try {
    const {
      title, content, category, audience,
      startDate, startTime, endDate, endTime,
      visible, sendNotification,
    } = req.body;

    const notice = await Notice.findByPk(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });

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

    await notice.save();

    res.json({ message: "Notice updated successfully", notice });
    emitChange("notices", "updated", { id: notice.id });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByPk(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });

   
    if (Array.isArray(notice.attachments)) {
      notice.attachments.forEach((a) => safeUnlink(attachmentDiskPath(a)));
    }

    await notice.destroy();
    res.json({ message: "Notice deleted successfully" });
    emitChange("notices", "deleted", { id: req.params.id });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.bulkDeleteNotices = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid IDs provided" });
    }

    const notices = await Notice.findAll({ where: { id: { [Op.in]: ids } } });

    notices.forEach((notice) => {
      if (Array.isArray(notice.attachments)) {
        notice.attachments.forEach((a) => safeUnlink(attachmentDiskPath(a)));
      }
    });

    const deleted = await Notice.destroy({ where: { id: { [Op.in]: ids } } });

    res.json({ message: `${deleted} notice(s) deleted successfully` });
    emitChange("notices", "deleted", { count: deleted });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.toggleVisibility = async (req, res) => {
  try {
    const notice = await Notice.findByPk(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });

    notice.visible = !notice.visible;
    await notice.save(); 

    res.json({
      message: `Notice is now ${notice.visible ? "visible" : "hidden"}`,
      notice,
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const notice = await Notice.findByPk(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });

    const newAttachment = {
      fileName: req.file.originalname,
      fileUrl: `/uploads/notices/${req.file.filename}`,
      uploadedAt: new Date().toISOString(),
    };

 
    notice.attachments = [...(notice.attachments || []), newAttachment];
    await notice.save();

    res.json({ message: "Attachment uploaded successfully", notice });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { attachmentIndex } = req.body;
    const notice = await Notice.findByPk(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });

    const attachments = notice.attachments || [];
    if (attachmentIndex < 0 || attachmentIndex >= attachments.length) {
      return res.status(400).json({ message: "Invalid attachment index" });
    }

    safeUnlink(attachmentDiskPath(attachments[attachmentIndex]));

  
    notice.attachments = attachments.filter((_, i) => i !== attachmentIndex);
    await notice.save();

    res.json({ message: "Attachment deleted successfully", notice });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.duplicateNotice = async (req, res) => {
  try {
    const original = await Notice.findByPk(req.params.id);
    if (!original) return res.status(404).json({ message: "Notice not found" });

    const newNotice = await Notice.create({
      title: `${original.title} (Copy)`,
      content: original.content,
      category: original.category,
      audience: original.audience,
      startDate: new Date(),
      startTime: original.startTime,
      endDate: null,
      endTime: original.endTime,
      visible: false,
      sendNotification: false,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
      attachments: [], 
    });

    res.status(201).json({ message: "Notice duplicated successfully", notice: newNotice });
    emitChange("notices", "created", { id: newNotice.id, title: newNotice.title });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getNoticeStats = async (req, res) => {
  try {

    const [total, byStatus] = await Promise.all([
      Notice.count(),
      Notice.findAll({
        attributes: [
          "status",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["status"],
        raw: true,
      }),
    ]);

    const statMap = byStatus.reduce((acc, row) => {
      acc[row.status] = Number(row.count);
      return acc;
    }, {});

    res.json({
      total,
      active: statMap.active || 0,
      scheduled: statMap.scheduled || 0,
      expired: statMap.expired || 0,
      hidden: statMap.hidden || 0,
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};
