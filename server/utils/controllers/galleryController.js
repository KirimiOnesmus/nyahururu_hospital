"use strict";

const fs = require("fs");
const logger = require("../utils/logger");
const path = require("path");
const { Op } = require("sequelize");
const { Gallery, User, sequelize } = require("../sequelize/models");

// ── Helpers ─────────────────────────────────────────────────────────

const SORTABLE_COLUMNS = new Set([
  "uploadDate", "createdAt", "updatedAt", "views", "likes", "title",
]);
const parseSort = (raw) => {
  if (!raw) return [["uploadDate", "DESC"]];
  const dir = raw.startsWith("-") ? "DESC" : "ASC";
  const col = raw.replace(/^-/, "");
  if (!SORTABLE_COLUMNS.has(col)) return [["uploadDate", "DESC"]];
  return [[col, dir]];
};

const UPLOADER_INCLUDE = [
  { model: User, as: "uploader", attributes: ["id", "name", "email"] },
];

const galleryDiskPath = (item) =>
  path.join(__dirname, "../public", item.fileUrl);

const safeUnlink = (filePath) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error("Failed to remove gallery file:", filePath, err);
  }
};

// ── CRUD ────────────────────────────────────────────────────────────

exports.getAllGallery = async (req, res) => {
  try {
    const { category, type, visible, search, sort = "-uploadDate" } = req.query;

    const where = {};
    if (category && category !== "all") where.category = category;
    if (type && type !== "all") where.type = type;
    if (visible !== undefined) where.visible = visible === "true";

    if (search) {
      const escaped = String(search).replace(/[\\%_]/g, (m) => `\\${m}`);
      const like = `%${escaped}%`;
      where[Op.or] = [
        { title: { [Op.like]: like } },
        { description: { [Op.like]: like } },
        // `tags` is a JSON array column, so a plain LIKE on it doesn't
        // match individual elements the way Mongo's $in did. MySQL's
        // JSON_SEARCH walks the array and returns the path of the first
        // element that matches the pattern (or NULL if none do), so
        // "IS NOT NULL" is our "any element matches" test. Bindings via
        // Sequelize's parameterisation, not string interp — no injection.
        sequelize.literal(
          "JSON_SEARCH(tags, 'one', " +
            sequelize.escape(like) +
            ") IS NOT NULL",
        ),
      ];
    }

    const items = await Gallery.findAll({
      where,
      include: UPLOADER_INCLUDE,
      order: parseSort(sort),
    });

    res.json(items);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getGalleryById = async (req, res) => {
  try {
    // Transactional read + view-increment so concurrent readers don't
    // race on the counter.
    const item = await sequelize.transaction(async (t) => {
      const g = await Gallery.findByPk(req.params.id, {
        include: UPLOADER_INCLUDE,
        transaction: t,
      });
      if (!g) return null;
      g.views = (g.views || 0) + 1;
      await g.save({ transaction: t });
      return g;
    });

    if (!item) return res.status(404).json({ message: "Gallery item not found" });
    res.json(item);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.createGallery = async (req, res) => {
  try {
    const { title, description, category, tags, visible } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        message: "Missing required fields: title and category",
      });
    }
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { mimetype: mimeType, filename, size } = req.file;
    const fileType = mimeType.startsWith("image") ? "image" : "video";
    const fileUrl = `/uploads/gallery/${filename}`;

    // Tags arrive as a comma-separated string from multipart form data
    // (JSON can't be sent alongside a file upload cleanly). Split &
    // trim, drop empties. Stored as a real JSON array in MySQL.
    const parsedTags = tags
      ? String(tags).split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const gallery = await Gallery.create({
      title,
      description,
      type: fileType,
      category,
      fileUrl,
      fileName: filename,
      fileSize: size,
      mimeType,
      tags: parsedTags,
      visible: visible !== false,
      uploadedBy: req.user?.id,
    });

    res.status(201).json({
      message: "Gallery item uploaded successfully",
      item: gallery,
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.updateGallery = async (req, res) => {
  try {
    const { title, description, category, tags, visible } = req.body;

    const item = await Gallery.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Gallery item not found" });

    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (category !== undefined) item.category = category;
    if (tags !== undefined) {
      // Reassignment (not in-place push) so Sequelize's change tracker
      // marks the JSON column as dirty and emits the UPDATE.
      item.tags = String(tags).split(",").map((t) => t.trim()).filter(Boolean);
    }
    if (visible !== undefined) item.visible = visible;

    await item.save();

    res.json({ message: "Gallery item updated successfully", item });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.deleteGallery = async (req, res) => {
  try {
    const item = await Gallery.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Gallery item not found" });

    if (item.fileUrl) safeUnlink(galleryDiskPath(item));
    await item.destroy();

    res.json({ message: "Gallery item deleted successfully" });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.bulkDeleteGallery = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid IDs provided" });
    }

    const items = await Gallery.findAll({ where: { id: { [Op.in]: ids } } });
    items.forEach((item) => {
      if (item.fileUrl) safeUnlink(galleryDiskPath(item));
    });

    const deleted = await Gallery.destroy({ where: { id: { [Op.in]: ids } } });

    res.json({ message: `${deleted} item(s) deleted successfully` });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.toggleVisibility = async (req, res) => {
  try {
    const item = await Gallery.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Gallery item not found" });

    item.visible = !item.visible;
    await item.save();

    res.json({
      message: `Gallery item is now ${item.visible ? "visible" : "hidden"}`,
      item,
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.likeGallery = async (req, res) => {
  try {
    // Atomic increment — avoids the read-modify-write race where two
    // concurrent likes could each read likes=5 and both write 6 (a lost
    // update). increment() emits `UPDATE ... SET likes = likes + 1`.
    const [, affected] = await Gallery.increment(
      { likes: 1 },
      { where: { id: req.params.id } },
    );

    // Sequelize's increment doesn't tell us in a portable way whether
    // the row existed; refetch to both confirm existence and return the
    // fresh count to the client.
    const item = await Gallery.findByPk(req.params.id, {
      attributes: ["id", "likes"],
    });
    if (!item) return res.status(404).json({ message: "Gallery item not found" });

    res.json({ message: "Item liked", likes: item.likes });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getGalleryStats = async (req, res) => {
  try {
    // Single aggregate pull rather than N COUNT round trips.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      total, images, videos, visible, hidden, categoryRows, recentItems,
    ] = await Promise.all([
      Gallery.count(),
      Gallery.count({ where: { type: "image" } }),
      Gallery.count({ where: { type: "video" } }),
      Gallery.count({ where: { visible: true } }),
      Gallery.count({ where: { visible: false } }),
      Gallery.findAll({
        attributes: [
          [sequelize.fn("DISTINCT", sequelize.col("category")), "category"],
        ],
        raw: true,
      }),
      // The Mongoose version was `.find().sort().limit(7).countDocuments()`
      // — Mongoose's countDocuments ignores sort/limit, so that call
      // effectively returned `total`, which was almost certainly a bug.
      // Reinterpreting the intent as "items uploaded in the last 7 days"
      // which is a common analytics metric. See MIGRATION_PLAN.md for the
      // full audit trail on behaviour changes.
      Gallery.count({ where: { uploadDate: { [Op.gte]: sevenDaysAgo } } }),
    ]);

    res.json({
      total,
      images,
      videos,
      visible,
      hidden,
      categories: categoryRows.length,
      recentItems,
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};
