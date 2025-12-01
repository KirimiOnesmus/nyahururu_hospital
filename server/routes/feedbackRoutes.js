const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getAllFeedback,
  getFeedbackById,
  respondToFeedback,
  deleteFeedback
} = require('../controllers/feedbackController');

const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Public — submit feedback
router.post('/', submitFeedback);

// Admin / Communication — view all feedback
router.get('/', verifyToken, authorizeRoles('admin', 'communication'), getAllFeedback);

// Admin / Communication — view single feedback
router.get('/:id', verifyToken, authorizeRoles('admin', 'communication'), getFeedbackById);

// Admin / Communication — respond or mark handled
router.put('/:id/respond', verifyToken, authorizeRoles('admin', 'communication'), respondToFeedback);

// Optional alias to support frontends that used POST /reply/:id
router.post('/reply/:id', verifyToken, authorizeRoles('admin', 'communication'), respondToFeedback);

// Admin — delete feedback
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteFeedback);

module.exports = router;
