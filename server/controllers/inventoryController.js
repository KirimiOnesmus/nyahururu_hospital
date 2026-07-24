"use strict";

const { Op } = require("sequelize");
const { Inventory, User, sequelize } = require("../sequelize/models");

// ── Helpers ─────────────────────────────────────────────────────────

const AUTHOR_INCLUDE = [
  { model: User, as: "creator", attributes: ["id", "name", "email"] },
  { model: User, as: "updater", attributes: ["id", "name", "email"] },
];

// Mongo's `$expr: { $lt: ['$quantity', '$minThreshold'] }` was a
// column-vs-column comparison. Sequelize supports the same via
// sequelize.where + col references, which compiles to a plain SQL
// `quantity < min_threshold`. Reused across getLowStockItems and
// getInventoryStats.
const LOW_STOCK_WHERE = sequelize.where(
  sequelize.col("quantity"),
  Op.lt,
  sequelize.col("min_threshold"),
);

// ── CRUD ────────────────────────────────────────────────────────────

exports.getAllInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findAll({
      include: AUTHOR_INCLUDE,
      order: [["createdAt", "DESC"]],
    });
    res.json(inventory);
  } catch (error) {
    console.error("Get all inventory error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findByPk(req.params.id, {
      include: AUTHOR_INCLUDE,
    });
    if (!item) return res.status(404).json({ message: "Inventory item not found" });
    res.json(item);
  } catch (error) {
    console.error("Get inventory by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.createInventory = async (req, res) => {
  try {
    const {
      name, category, quantity, unit, price, supplier, batch,
      expiry, minThreshold, sku, description,
    } = req.body;

    if (!name || !category || quantity === undefined || !unit || price === undefined) {
      return res.status(400).json({
        message: "Missing required fields: name, category, quantity, unit, price",
      });
    }

    // Explicit SKU-duplicate guard for a clean 400. The model's sparse
    // unique index still catches races. (SKU is nullable, MySQL allows
    // multiple NULLs on a unique index — same "sparse unique" semantics
    // the Mongoose schema had.)
    if (sku) {
      const existingSku = await Inventory.findOne({ where: { sku } });
      if (existingSku) return res.status(400).json({ message: "SKU already exists" });
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
      minThreshold: minThreshold ?? 5,
      sku,
      description,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    res.status(201).json({
      message: "Inventory item created successfully",
      item: newItem,
    });
  } catch (error) {
    console.error("Create inventory error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const {
      name, category, quantity, unit, price, supplier, batch,
      expiry, minThreshold, sku, description,
    } = req.body;

    const item = await Inventory.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Inventory item not found" });

    if (sku && sku !== item.sku) {
      const existingSku = await Inventory.findOne({
        where: { sku, id: { [Op.ne]: item.id } },
      });
      if (existingSku) return res.status(400).json({ message: "SKU already exists" });
    }

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
    // NOTE: preserved the Mongoose behaviour of stamping lastRestocked
    // on every update. That's arguably too broad (only a quantity
    // increase is a real restock), but tightening it would be a
    // semantic change and belongs in a separate follow-up — cutover is
    // supposed to preserve behaviour, not refactor it.
    item.lastRestocked = new Date();

    await item.save();

    res.json({ message: "Inventory item updated successfully", item });
  } catch (error) {
    console.error("Update inventory error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteInventory = async (req, res) => {
  try {
    const item = await Inventory.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Inventory item not found" });

    await item.destroy();
    res.json({ message: "Inventory item deleted successfully" });
  } catch (error) {
    console.error("Delete inventory error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── Reports ─────────────────────────────────────────────────────────

exports.getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.findAll({
      where: LOW_STOCK_WHERE,
      order: [["quantity", "ASC"]],
    });
    res.json(items);
  } catch (error) {
    console.error("Get low stock items error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getExpiredItems = async (req, res) => {
  try {
    const items = await Inventory.findAll({
      where: { expiry: { [Op.lte]: new Date() } },
      order: [["expiry", "ASC"]],
    });
    res.json(items);
  } catch (error) {
    console.error("Get expired items error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getExpiringItems = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const items = await Inventory.findAll({
      where: { expiry: { [Op.gte]: now, [Op.lte]: thirtyDaysFromNow } },
      order: [["expiry", "ASC"]],
    });
    res.json(items);
  } catch (error) {
    console.error("Get expiring items error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getInventoryStats = async (req, res) => {
  try {
    // All four counts / aggregates in parallel — four round trips
    // become one wall-clock window on the connection pool.
    const [total, byCategoryRaw, lowStock, expired] = await Promise.all([
      Inventory.count(),
      Inventory.findAll({
        attributes: [
          "category",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["category"],
        raw: true,
      }),
      Inventory.count({ where: LOW_STOCK_WHERE }),
      Inventory.count({ where: { expiry: { [Op.lte]: new Date() } } }),
    ]);

    // Reshape byCategory to the { _id, count } shape the frontend
    // received from the Mongo `$group` output. Kept intentionally to
    // avoid changing the client contract during cutover.
    const byCategory = byCategoryRaw.map((r) => ({
      _id: r.category,
      count: Number(r.count),
    }));

    res.json({ total, byCategory, lowStock, expired });
  } catch (error) {
    console.error("Get inventory stats error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.searchInventory = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Search query is required" });

    // Escape LIKE metacharacters so a search for "50%" doesn't become
    // a runaway wildcard. utf8mb4_unicode_ci is already
    // case-insensitive so no explicit flag needed. `category` is an
    // ENUM column here but MySQL treats ENUMs as strings for LIKE
    // comparison — the Mongoose behaviour is preserved.
    const escaped = String(query).replace(/[\\%_]/g, (m) => `\\${m}`);
    const like = `%${escaped}%`;

    const items = await Inventory.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: like } },
          { category: { [Op.like]: like } },
          { supplier: { [Op.like]: like } },
          { sku: { [Op.like]: like } },
        ],
      },
    });

    res.json(items);
  } catch (error) {
    console.error("Search inventory error:", error);
    res.status(500).json({ message: error.message });
  }
};
