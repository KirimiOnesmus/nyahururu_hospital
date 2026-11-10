const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  downloadReport,
  getReportsByCategory,
  addComment,
  bulkDeleteReports,
} = require('../controllers/reportController');

const { verifyToken, authorizeRoles, optionalStaff } = require('../middleware/auth');
const createUploader = require('../middleware/upload');

const upload = createUploader('reports');

router.get('/', optionalStaff, getAllReports); 
router.get('/category/:category', optionalStaff, getReportsByCategory);
router.get('/:id/download', optionalStaff, downloadReport);
router.get('/:id', optionalStaff, getReportById);

router.post('/', verifyToken,authorizeRoles('admin', 'it'), upload.single('file'), createReport);
router.put('/:id', verifyToken,authorizeRoles('admin','it'), upload.single('file'), updateReport);
router.delete('/:id', verifyToken,authorizeRoles('admin', 'it'), deleteReport);
router.post('/bulk-delete', verifyToken, authorizeRoles('admin'),bulkDeleteReports);


const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many comments submitted. Please try again later.",
    });
  },
});
router.post('/:id/comments', verifyToken, commentLimiter, addComment);

module.exports = router;