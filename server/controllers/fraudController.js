const emitChange = require("../utils/emitChange");
"use strict";

const { Op } = require("sequelize");
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
    const { status, search } = req.query;
    const where = status && status !== "all" ? { status } : {};
    if (search) {
      const escaped = String(search).replace(/[\\%_]/g, (m) => `\\${m}`);
      where[Op.or] = [
        { issue: { [Op.like]: `%${escaped}%` } },
        { location: { [Op.like]: `%${escaped}%` } },
        { details: { [Op.like]: `%${escaped}%` } },
      ];
    }

    const { requestedPaging, page, limit, offset } = getPagination(req.query);
    const [{ rows: reports, count: total }, statusRows, allCount] = await Promise.all([
      FraudReport.findAndCountAll({ where, order: [["createdAt", "DESC"]], limit, offset }),
      FraudReport.count({ group: ["status"] }),
      FraudReport.count(),
    ]);
    if (!requestedPaging) return res.json(reports);
    const statusCounts = Object.fromEntries(statusRows.map(({ status: key, count: value }) => [key, Number(value)]));
    const stats = {
      total: allCount,
      reviewed: statusCounts.reviewed || 0,
      pending: statusCounts.pending || 0,
      dismissed: statusCounts.dismissed || 0,
    };
    return res.json({ data: reports, meta: { ...buildMeta(page, limit, total, reports.length, offset), stats } });
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
