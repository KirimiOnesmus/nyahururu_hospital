const Career = require("../models/careersModel");
const CareerApplication = require("../models/careersApplicationModel");

// Get all careers with application counts

exports.getAllCareers = async (req, res) => {
  try {
    const careers = await Career.find().sort({ createdAt: -1 });

    // Add application counts
    const careersWithCount = await Promise.all(
      careers.map(async (c) => {
        const applicationsCount = await CareerApplication.countDocuments({ careerId: c._id });
        return { ...c.toObject(), applicationsCount };
      })
    );

    res.status(200).json(careersWithCount);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching careers" });
  }
};

// Get a single career by ID
exports.getCareerById = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);
    if (!career) return res.status(404).json({ message: "Career not found" });
    res.status(200).json(career);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching career" });
  }
};

// Create a new career
exports.createCareer = async (req, res) => {
  try {
    const { title, department, location, description, deadline } = req.body;
    const career = await Career.create({ title, department, location, description, deadline });
    res.status(201).json(career);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Error creating career" });
  }
};

//Update an existing career

exports.updateCareer = async (req, res) => {
  try {
    const career = await Career.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!career) return res.status(404).json({ message: "Career not found" });
    res.status(200).json(career);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Error updating career" });
  }
};

// Delete a career and its applications 

exports.deleteCareer = async (req, res) => {
  try {
    const career = await Career.findByIdAndDelete(req.params.id);
    if (!career) return res.status(404).json({ message: "Career not found" });

    // Delete all associated applications
    await CareerApplication.deleteMany({ careerId: req.params.id });

    res.status(200).json({ message: "Career and associated applications deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting career" });
  }
};
