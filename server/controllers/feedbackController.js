const emitChange = require("../utils/emitChange");
"use strict";

const { Feedback } = require("../sequelize/models");
const logger = require("../utils/logger");
const { sendFeedbackReplyEmail } = require("../utils/emailServices");
const { getPagination, buildMeta } = require("../utils/pagination");

exports.submitFeedback = async (req, res) => {
  try {
    const { name, email, subject, message, type } = req.body;
    if (!message || !type) {
      return res.status(400).json({ message: "Message and type are required" });
    }

    const feedback = await Feedback.create({
      name,
      email,
      subject,
      message,
      type,
      status: "pending",
    });

    res.status(201).json({ message: "Feedback submitted successfully", feedback });
    emitChange("feedback", "created", { id: feedback.id });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const { type, status } = req.query;

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const { requestedPaging, page, limit, offset } = getPagination(req.query);
    const { rows: feedback, count: total } = await Feedback.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    if (!requestedPaging) return res.json(feedback);
    return res.json({ data: feedback, meta: buildMeta(page, limit, total, feedback.length, offset) });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};


exports.getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    res.json(feedback);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};


exports.respondToFeedback = async (req, res) => {
  try {
    const { response, status } = req.body;
    const feedback = await Feedback.findByPk(req.params.id);

    if (!feedback) return res.status(404).json({ message: "Feedback not found" });

    if (typeof response !== "undefined") feedback.response = response;
    if (typeof status !== "undefined") feedback.status = status;

    if (req.user) {

      if (req.user.id) feedback.respondedBy = req.user.id;
      if (req.user.name) feedback.respondedByName = req.user.name;
    }

    feedback.respondedAt = new Date();

    await feedback.save();

    if (response && feedback.email) {
      try {
        await sendFeedbackReplyEmail(
          feedback.email,
          feedback.name,
          feedback.message,
          response,
        );
      } catch (emailError) {
        console.error("Failed to send feedback reply email:", emailError);
      }
    }

    res.json({ message: "Feedback updated successfully", feedback });
    emitChange("feedback", "updated", { id: feedback.id });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });

    await feedback.destroy();
    res.json({ message: "Feedback deleted successfully" });
    emitChange("feedback", "deleted", { id: req.params.id });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};
