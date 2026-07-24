"use strict";

const { Feedback } = require("../sequelize/models");
const { sendFeedbackReplyEmail } = require("../utils/emailServices");

// Submit feedback (Public)
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin / Communication — View all feedback
exports.getAllFeedback = async (req, res) => {
  try {
    const { type, status } = req.query;
    // Build the where-clause dynamically so an omitted query param means
    // "no filter" — same semantics as the Mongoose empty-object filter.
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const feedback = await Feedback.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin / Communication — View single feedback
exports.getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin / Communication — Respond or mark as handled
exports.respondToFeedback = async (req, res) => {
  try {
    const { response, status } = req.body;
    const feedback = await Feedback.findByPk(req.params.id);

    if (!feedback) return res.status(404).json({ message: "Feedback not found" });

    if (typeof response !== "undefined") feedback.response = response;
    if (typeof status !== "undefined") feedback.status = status;

    if (req.user) {
      // req.user comes from verifyToken → Sequelize User instance now, so
      // it always exposes `id`. Keep the fallback chain in case a future
      // dual-token flow attaches a research-side object with a different
      // shape.
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin — Delete feedback
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });

    await feedback.destroy();
    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
