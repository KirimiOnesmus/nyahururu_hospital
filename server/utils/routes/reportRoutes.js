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

const { verifyToken, authorizeRoles } = require('../middleware/auth');
const createUploader = require('../middleware/upload');

const upload = createUploader('reports');

// M-2: these routes are genuinely public (no auth) by design — hospital
// reports are meant to be publicly readable transparency documents. The
// old comment here claimed authentication was present; it wasn't, and
// that mismatch is corrected below rather than papered over.
router.get('/',  getAllReports); 
router.get('/category/:category',  getReportsByCategory);
router.get('/:id/download',  downloadReport);
router.get('/:id',getReportById);


// Protected routes (create/edit/delete)
router.post('/', verifyToken,authorizeRoles('admin'), upload.single('file'), createReport);
router.put('/:id', verifyToken,authorizeRoles('admin'), upload.single('file'), updateReport);
router.delete('/:id', verifyToken,authorizeRoles('admin'), deleteReport);
router.post('/bulk-delete', verifyToken, authorizeRoles('admin'),bulkDeleteReports);

// M-2: comments are intentionally open to anonymous visitors (no login
// wall for leaving feedback on a public report), but that previously
// meant no rate limiting at all beyond the app-wide global limiter —
// a straightforward spam/abuse target. Same pattern as authLimiter in
// app.js, scoped to this endpoint.
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
router.post('/:id/comments', commentLimiter, addComment);

module.exports = router;