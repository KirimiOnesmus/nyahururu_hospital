const News = require("../models/newsModel");

exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const item = await News.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "News not found" });
    res.json(item);
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

    const newNews = await News.create({
      title,
      content,
      author,
      imageUrl,
    });

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
    if (imageUrl) updateData.imageUrl = imageUrl;

    const updatedNews = await News.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!updatedNews) {
      return res.status(404).json({ message: "News not found" });
    }

    res.json({ message: "News updated successfully", updatedNews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const deletedNews = await News.findByIdAndDelete(req.params.id);
    if (!deletedNews)
      return res.status(404).json({ message: "News not found" });
    res.json({ message: "News deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
