const CareerApplication = require("../models/careersApplicationModel");

// Public: submit a new application
exports.submitApplication = async (req, res) => {
  try {
    const app = await CareerApplication.create(req.body);
    res.status(201).json(app);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Admin: get all applications (optionally filter by careerId)
exports.getAllApplications = async (req, res) => {
  try {
    const query = {};
    if (req.query.careerId) query.careerId = req.query.careerId;
    const apps = await CareerApplication.find(query).sort({ createdAt: -1 });
    res.status(200).json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: get single application by ID
exports.getApplicationById = async (req, res) => {
  try {
    const app = await CareerApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: "Application not found" });
    res.status(200).json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const app = await CareerApplication.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.status(200).json(app);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Admin: delete application
exports.deleteApplication = async (req, res) => {
  try {
    await CareerApplication.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Application deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Admin: get all applications for a specific job
exports.getApplicationsByJob = async (req, res) => {
  try {
    const apps = await CareerApplication.find({ careerId: req.params.careerId }).sort({ createdAt: -1 });
    res.status(200).json(apps);
  } catch (err) {
    res.status(500).json({ message: "Error fetching applications" });
  }
};
