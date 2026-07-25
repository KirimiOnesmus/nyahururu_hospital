"use strict";

const fs = require("fs");
const logger = require("../utils/logger");
const path = require("path");
const { Op } = require("sequelize");
const { Notice, User, sequelize } = require("../sequelize/models");
const { getPagination, buildMeta } = require("../utils/pagination");

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Translate the client's Mongoose-style sort string into Sequelize's
 * order-array form. Accepts "field" (asc) or "-field" (desc), same as
 * Mongoose. Defaults to createdAt DESC when nothing usable is passed.
 *
 * Whitelisted to a small set of columns so a client can't slip
 * arbitrary column names / expressions into ORDER BY.
 */
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

// The two populated author fields — a hot path (every list + detail
// call), so this is worth naming once here rather than re-writing every
// query.
const AUTHOR_INCLUDE = [
  { model: User, as: "creator", attributes: ["id", "name", "email"] },
  { model: User, as: "updater", attributes: ["id", "name", "email"] },
];

// Attachment paths on disk sit under /public/uploads/notices/… — the
// same path convention Mongoose used. Extracted so the same delete
// logic works from every entry point (single, bulk, single-attachment).
const attachmentDiskPath = (attachment) =>
  path.join(__dirname, "../public", attachment.fileUrl);

const safeUnlink = (filePath) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    // Filesystem cleanup is best-effort — a missing/locked file
    // shouldn't fail the DB delete that was already durable.
    console.error("Failed to remove attachment file:", filePath, err);
  }
};

// ── CRUD ────────────────────────────────────────────────────────────

exports.getAllNotices = async (req, res) => {
  try {
    const { category, audience, status, search, sort = "-createdAt" } = req.query;

    const where = {};
    if (category && category !== "all") where.category = category;
    if (audience && audience !== "all") where.audience = audience;
    if (status && status !== "all") where.status = status;

    // Mongoose case-insensitive $regex → MySQL LIKE. utf8mb4_unicode_ci
    // is our default collation so LIKE is already case-insensitive; no
    // per-query flag needed. Escape SQL LIKE metacharacters so a search
    // for "50%" doesn't match every row.
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
    // Wrap the read + view-increment in a transaction so a concurrent
    // reader can't see a half-updated view count. Not strictly required
    // for correctness but keeps behaviour clean under load.
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

    // The Notice model's beforeSave hook derives `status` from
    // visibility + start/end windows — no need to compute it here.
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
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByPk(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });

    // Attachment cleanup BEFORE destroying the row — if the disk cleanup
    // fails we still want the row to disappear (best-effort semantics),
    // but reading attachments off a destroyed instance would be racy.
    if (Array.isArray(notice.attachments)) {
      notice.attachments.forEach((a) => safeUnlink(attachmentDiskPath(a)));
    }

    await notice.destroy();
    res.json({ message: "Notice deleted successfully" });
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

    // File cleanup first, then a single DELETE — matches Mongoose's
    // find-then-deleteMany flow.
    notices.forEach((notice) => {
      if (Array.isArray(notice.attachments)) {
        notice.attachments.forEach((a) => safeUnlink(attachmentDiskPath(a)));
      }
    });

    const deleted = await Notice.destroy({ where: { id: { [Op.in]: ids } } });

    res.json({ message: `${deleted} notice(s) deleted successfully` });
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
    await notice.save(); // beforeSave hook recomputes status

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

    // JSON columns require reassignment (not in-place mutation) for
    // Sequelize's change tracker to see the update. Same pattern as
    // Bid.addActivityLog / Report.addComment.
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

    // Rebuild the array so Sequelize picks up the JSON change.
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
      attachments: [], // never carry attachments through a duplicate — matches Mongoose behaviour
    });

    res.status(201).json({ message: "Notice duplicated successfully", notice: newNotice });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getNoticeStats = async (req, res) => {
  try {
    // Five COUNT queries in Mongoose; in Sequelize we can pull it all in
    // a single grouped aggregate for four sub-queries + one total, which
    // is cheaper on MySQL as well as more legible.
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
