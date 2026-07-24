"use strict";

const { News } = require("../sequelize/models");

exports.getAllNews = async (req, res) => {
  try {
    const news = await News.findAll({ order: [["createdAt", "DESC"]] });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const item = await News.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "News not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// getActiveNews returns the same set as getAllNews today — kept as its
// own export so the public/active/routes can diverge later without a
// route-file rewrite.
exports.getActiveNews = async (req, res) => {
  try {
    const news = await News.findAll({ order: [["createdAt", "DESC"]] });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createNews = async (req, res) => {
  try {
    const { title, content, author } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const imageUrl = req.file ? `/uploads/news/${req.file.filename}` : null;

    const newNews = await News.create({ title, content, author, imageUrl });

    res.status(201).json({ message: "News created successfully", newNews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const imageUrl = req.file ? `/uploads/news/${req.file.filename}` : undefined;

    const updateData = { title, content, author };
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const news = await News.findByPk(req.params.id);
    if (!news) return res.status(404).json({ message: "News not found" });

    news.set(updateData);
    await news.save();

    res.json({ message: "News updated successfully", updatedNews: news });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    if (!news) return res.status(404).json({ message: "News not found" });

    await news.destroy();
    res.json({ message: "News deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
