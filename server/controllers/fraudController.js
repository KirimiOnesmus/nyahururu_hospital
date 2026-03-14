const FraudReport = require('../models/fraudModel');

// Submit a new fraud report
exports.submitFraudReport = async (req, res) => {
  try {
    const { issue, dateOfIncident, location, details } = req.body;

    if (!issue || !details) {
      return res.status(400).json({ message: "Issue and details are required." });
    }

    const report = await FraudReport.create({
      issue,
      dateOfIncident,
      location,
      details,
    });

    res.status(201).json({
      message: "Your report has been submitted successfully. It will be reviewed soon.",
      report,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin — Get all fraud reports
exports.getAllFraudReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const reports = await FraudReport.find(filter).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin — Get single report by ID
exports.getFraudReportById = async (req, res) => {
  try {
    const report = await FraudReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Fraud report not found" });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin — Update status or investigation notes
exports.updateFraudStatus = async (req, res) => {
  try {
    const { status, investigationNotes } = req.body;
    const report = await FraudReport.findById(req.params.id);

    if (!report) return res.status(404).json({ message: "Fraud report not found" });

    if (status) report.status = status;
    if (investigationNotes) report.investigationNotes = investigationNotes;

    // Optional — record admin reviewer
    if (req.user) {
      if (req.user._id) report.reviewedBy = req.user._id;
      if (req.user.name) report.reviewedByName = req.user.name;
    }

    report.reviewedAt = new Date();
    await report.save();

    res.json({ message: "Fraud report updated successfully", report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin — Delete a report
exports.deleteFraudReport = async (req, res) => {
  try {
    const deleted = await FraudReport.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Fraud report not found" });
    res.json({ message: "Fraud report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
