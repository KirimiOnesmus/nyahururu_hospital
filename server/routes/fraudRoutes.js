const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  submitFraudReport,
  getAllFraudReports,
  getFraudReportById,
  updateFraudStatus,
  deleteFraudReport
} = require('../controllers/fraudController');

const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { validate, fraudReportSchema } = require('../utils/validators');

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many reports submitted. Please try again later.",
    });
  },
});

router.post('/', submitLimiter, validate(fraudReportSchema), submitFraudReport);

router.get('/', verifyToken, authorizeRoles('admin', 'communication','it'), getAllFraudReports);

router.get('/:id', verifyToken, authorizeRoles('admin', 'communication', 'it'), getFraudReportById);

router.put('/:id/status', verifyToken, authorizeRoles('admin', 'communication', "it"), updateFraudStatus);


router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteFraudReport);

module.exports = router;
