const express = require('express');
const router = express.Router();
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

// Public routes (with authentication)
router.get('/',  getAllReports); 
router.get('/:id',getReportById);
router.get('/category/:category',  getReportsByCategory);
router.get('/:id/download',  downloadReport);

// Protected routes (create/edit/delete)
router.post('/', verifyToken,authorizeRoles('admin'), upload.single('file'), createReport);
router.put('/:id', verifyToken,authorizeRoles('admin'), upload.single('file'), updateReport);
router.delete('/:id', verifyToken,authorizeRoles('admin'), deleteReport);
router.post('/bulk-delete', verifyToken, authorizeRoles('admin'),bulkDeleteReports);

// Comments
router.post('/:id/comments', addComment);

module.exports = router;