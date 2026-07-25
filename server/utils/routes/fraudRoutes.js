const express = require('express');
const router = express.Router();
const {
  submitFraudReport,
  getAllFraudReports,
  getFraudReportById,
  updateFraudStatus,
  deleteFraudReport
} = require('../controllers/fraudController');

const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Public: submit report
router.post('/', submitFraudReport);

// Admin or communication: view all reports
router.get('/', verifyToken, authorizeRoles('admin', 'communication'), getAllFraudReports);

// Admin or communication: view single report
router.get('/:id', verifyToken, authorizeRoles('admin', 'communication'), getFraudReportById);

// Admin or communication: update report status
router.put('/:id/status', verifyToken, authorizeRoles('admin', 'communication'), updateFraudStatus);

// Admin: delete report
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteFraudReport);

module.exports = router;
