"use strict";

const { GalleryCategory } = require("../sequelize/models");
const logger = require("../utils/logger");

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await GalleryCategory.findAll({
      where: { active: true },
      order: [["order", "ASC"]],
    });
    res.json(categories);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await GalleryCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

  
    const existing = await GalleryCategory.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await GalleryCategory.create({
      name,
      description,
      icon,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description, icon, order, active } = req.body;

    const category = await GalleryCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (order !== undefined) category.order = order;
    if (active !== undefined) category.active = active;

    await category.save();

    res.json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await GalleryCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.destroy();
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};
