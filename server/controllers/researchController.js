const Research = require("../models/researchModel");

// Get all research
exports.getAllResearch = async (req, res) => {
  try {
    const research = await Research.find().sort({ createdAt: -1 });
    res.json(research);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get research by ID
exports.getResearchById = async (req, res) => {
  try {
    const item = await Research.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Research not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new research (Admin / IT)
exports.createResearch = async (req, res) => {
  try {
    const { title, author, abstract, category } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });
    

    const pdfUrl = req.files?.pdf ? `/uploads/research/${req.files.pdf[0].filename}` : null;
    const thumbnailUrl = req.files?.thumbnail
      ? `/uploads/research/${req.files.thumbnail[0].filename}`
      : null;

    const newResearch = await Research.create({
      title,
      author,
      abstract,
      category,
      pdfUrl,
      thumbnailUrl,
    });

    res.status(201).json({ message: "Research created successfully", newResearch });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateResearch = async (req, res) => {
  try {
    const { title, author, abstract, category } = req.body;

    const updateData = { title, author, abstract, category };

    if (req.files?.pdf) {
      updateData.fileUrl = `/uploads/research/${req.files.pdf[0].filename}`;
    }
    if (req.files?.thumbnail) {
      updateData.thumbnailUrl = `/uploads/research/${req.files.thumbnail[0].filename}`;
    }

    const updated = await Research.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ message: "Research not found" });

    res.json({ message: "Research updated successfully", updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteResearch = async (req, res) => {
  try {
    const deleted = await Research.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Research not found" });
    res.json({ message: "Research deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
