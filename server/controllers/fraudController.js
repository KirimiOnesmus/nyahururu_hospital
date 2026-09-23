const emitChange = require("../utils/emitChange");
"use strict";

const { FraudReport } = require("../sequelize/models");
const logger = require("../utils/logger");
const { getPagination, buildMeta } = require("../utils/pagination");

exports.submitFraudReport = async (req, res) => {
  try {
    const { issue, dateOfIncident, location, details } = req.body;

    if (!issue || !details) {
      return res.status(400).json({
        success: false,
        message: "Issue and details are required.",
      });
    }

    if (dateOfIncident) {
      const parsed = new Date(`${dateOfIncident}T00:00:00Z`);
      const today = new Date();
      const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      if (Number.isNaN(parsed.getTime()) || parsed.getTime() > todayUtc.getTime()) {
        return res.status(400).json({
          success: false,
          message: "Incident date cannot be in the future.",
        });
      }
    }

    await FraudReport.create({
      issue,
      dateOfIncident: dateOfIncident || null,
      location: location || null,
      details,
    });

    res.status(201).json({
      success: true,
      message: "Your report has been submitted successfully. It will be reviewed soon.",
    });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

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

exports.updateFraudStatus = async (req, res) => {
  try {
    const { status, investigationNotes } = req.body;
    const report = await FraudReport.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: "Fraud report not found" });

    if (status) report.status = status;
    if (investigationNotes) report.investigationNotes = investigationNotes;

 
    if (req.user) {
      if (req.user.id) report.reviewedBy = req.user.id;
      if (req.user.name) report.reviewedByName = req.user.name;
    }

    report.reviewedAt = new Date();
    await report.save();

    res.json({ message: "Fraud report updated successfully", report });
    emitChange("fraud", "updated", { id: report.id });
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
    emitChange("fraud", "deleted", { id: req.params.id });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};
