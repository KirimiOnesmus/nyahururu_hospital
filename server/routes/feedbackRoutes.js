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


router.post('/', submitFeedback);

router.get('/', verifyToken, authorizeRoles('admin', 'communication', 'it'), getAllFeedback);


router.get('/:id', verifyToken, authorizeRoles('admin', 'communication', 'it'), getFeedbackById);


router.put('/:id/respond', verifyToken, authorizeRoles('admin', 'communication', 'it'), respondToFeedback);


router.post('/reply/:id', verifyToken, authorizeRoles('admin', 'communication', 'it'), respondToFeedback);


router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteFeedback);

module.exports = router;
