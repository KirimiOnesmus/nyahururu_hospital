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

router.post('/', submitFraudReport);

router.get('/', verifyToken, authorizeRoles('admin', 'communication','it'), getAllFraudReports);

router.get('/:id', verifyToken, authorizeRoles('admin', 'communication', 'it'), getFraudReportById);

router.put('/:id/status', verifyToken, authorizeRoles('admin', 'communication', "it"), updateFraudStatus);


router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteFraudReport);

module.exports = router;
