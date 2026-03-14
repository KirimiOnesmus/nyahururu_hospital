const express = require('express');
const router = express.Router();
const {
  getAllNews,
  getActiveNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews
} = require('../controllers/newsController');

const { verifyToken, authorizeRoles } = require('../middleware/auth');
const createUploader  = require('../middleware/upload'); 
const uploadNews = createUploader("news");

router.get('/', getAllNews);
router.get('/active', getActiveNews);
router.get('/:id', getNewsById);

router.post(
  '/',
  verifyToken,
  authorizeRoles('admin', 'communication', 'it'),
  uploadNews.single('image'),
  createNews
);
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'communication', 'it'),
  uploadNews.single('image'),
  updateNews
);
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'communication', 'it'),
  deleteNews
); 

module.exports = router;
