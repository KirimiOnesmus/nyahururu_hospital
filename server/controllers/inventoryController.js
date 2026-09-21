const emitChange = require("../utils/emitChange");
"use strict";

const { Op } = require("sequelize");
const logger = require("../utils/logger");
const { Inventory, User, sequelize } = require("../sequelize/models");
const { getPagination, buildMeta } = require("../utils/pagination");

const AUTHOR_INCLUDE = [
  { model: User, as: "creator", attributes: ["id", "name", "email"] },
  { model: User, as: "updater", attributes: ["id", "name", "email"] },
];


const LOW_STOCK_WHERE = sequelize.where(
  sequelize.col("quantity"),
  Op.lt,
  sequelize.col("min_threshold"),
);



exports.getAllInventory = async (req, res) => {
  try {
    const { requestedPaging, page, limit, offset } = getPagination(req.query);
    const { rows: inventory, count: total } = await Inventory.findAndCountAll({
      include: AUTHOR_INCLUDE,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    if (!requestedPaging) return res.json(inventory);
    return res.json({ data: inventory, meta: buildMeta(page, limit, total, inventory.length, offset) });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
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
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
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
      emitChange("inventory", "created", { id: item.id });

    res.status(201).json({
      message: "Inventory item created successfully",

      item: newItem,
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
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

    item.lastRestocked = new Date();

    await item.save();

    res.json({ message: "Inventory item updated successfully", item });
    emitChange("inventory", "updated", { id: item.id });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.deleteInventory = async (req, res) => {
  try {
    const item = await Inventory.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Inventory item not found" });

    await item.destroy();
    res.json({ message: "Inventory item deleted successfully" });
    emitChange("inventory", "deleted", { id: req.params.id });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};



exports.getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.findAll({
      where: LOW_STOCK_WHERE,
      order: [["quantity", "ASC"]],
    });
    res.json(items);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
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
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
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
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getInventoryStats = async (req, res) => {
  try {

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


    const byCategory = byCategoryRaw.map((r) => ({
      _id: r.category,
      count: Number(r.count),
    }));

    res.json({ total, byCategory, lowStock, expired });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.searchInventory = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Search query is required" });


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
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};
