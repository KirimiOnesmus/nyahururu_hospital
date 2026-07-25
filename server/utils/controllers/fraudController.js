"use strict";

const { FraudReport } = require("../sequelize/models");
const logger = require("../utils/logger");
const { getPagination, buildMeta } = require("../utils/pagination");

// Submit a new fraud report — public endpoint (no auth required).
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
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

// Admin — list all fraud reports.
exports.getAllFraudReports = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const { requestedPaging, page, limit, offset } = getPagination(req.query);
    const { rows: reports, count: total } = await FraudReport.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    if (!requestedPaging) return res.json(reports);
    return res.json({ data: reports, meta: buildMeta(page, limit, total, reports.length, offset) });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

// Admin — single report by id.
exports.getFraudReportById = async (req, res) => {
  try {
    const report = await FraudReport.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: "Fraud report not found" });
    res.json(report);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

// Admin — update status or investigation notes.
exports.updateFraudStatus = async (req, res) => {
  try {
    const { status, investigationNotes } = req.body;
    const report = await FraudReport.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: "Fraud report not found" });

    if (status) report.status = status;
    if (investigationNotes) report.investigationNotes = investigationNotes;

    // Record reviewer identity. req.user is a Sequelize instance now, so
    // it always exposes `.id` (not `._id`) — dropped the Mongoose-side
    // fallback branch.
    if (req.user) {
      if (req.user.id) report.reviewedBy = req.user.id;
      if (req.user.name) report.reviewedByName = req.user.name;
    }

    report.reviewedAt = new Date();
    await report.save();

    res.json({ message: "Fraud report updated successfully", report });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.deleteFraudReport = async (req, res) => {
  try {
    const report = await FraudReport.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: "Fraud report not found" });

    await report.destroy();
    res.json({ message: "Fraud report deleted successfully" });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};
