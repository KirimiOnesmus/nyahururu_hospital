
const express = require('express');
const router = express.Router();
const {
  getAllTenders,
  getTenderById,
  createTender,
  updateTender,
  deleteTender,
  bulkDeleteTenders,
  closeTender,
  extendDeadline,
  awardTender,
  getTenderStatistics
} = require('../controllers/tenderController');


const { verifyToken, authorizeRoles } = require('../middleware/auth');
const createUploader  = require('../middleware/upload')
const upload = createUploader("tenders");

// Public routes
router.get('/', getAllTenders); 

router.get('/', getAllTenders);
router.get('/statistics', getTenderStatistics);
router.get('/:id', getTenderById);

// Admin/Manager only routes 
router.post('/', verifyToken,authorizeRoles('admin'), 
upload.array('attachments', 10), 
createTender);
router.put('/:id', verifyToken,authorizeRoles('admin'), upload.array('attachments', 10), updateTender);
router.delete('/:id', verifyToken,authorizeRoles('admin'), deleteTender);
router.post('/bulk-delete', verifyToken,authorizeRoles('admin'), bulkDeleteTenders);

// Tender management actions
router.patch('/:id/close',verifyToken,authorizeRoles('admin'), closeTender);
router.patch('/:id/extend-deadline', verifyToken,authorizeRoles('admin'), extendDeadline);
router.patch('/:id/award', verifyToken,authorizeRoles('admin'), awardTender);

module.exports = router;