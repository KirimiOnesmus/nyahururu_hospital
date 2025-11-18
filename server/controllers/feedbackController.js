const Feedback = require('../models/feedbackModel');

// Submit feedback (Public)
exports.submitFeedback = async (req, res) => {
  try {
    const { name, email, subject, message, type } = req.body;
    if (!message || !type) return res.status(400).json({ message: 'Message and type are required' });

    const feedback = await Feedback.create({
      name,
      email,
      subject,
      message,
      type,
      status: 'pending',
    });

    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin / Communication — View all feedback
exports.getAllFeedback = async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const feedback = await Feedback.find(filter).sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin / Communication — View single feedback
exports.getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin / Communication — Respond or mark as handled
exports.respondToFeedback = async (req, res) => {
  try {
    const { response, status } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    if (typeof response !== 'undefined') feedback.response = response;
    if (typeof status !== 'undefined') feedback.status = status;

    // prefer storing a user id for respondedBy if available
    if (req.user) {
      if (req.user._id) feedback.respondedBy = req.user._id;
      else if (req.user.id) feedback.respondedBy = req.user.id;
      else if (req.user.name) feedback.respondedByName = req.user.name; // fallback human-friendly
    }

    feedback.respondedAt = new Date();

    await feedback.save();

    res.json({ message: 'Feedback updated successfully', feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin — Delete feedback
exports.deleteFeedback = async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
