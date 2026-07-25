const express = require('express');
const router = express.Router();
const {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getLowStockItems,
  getExpiredItems,
  getExpiringItems,
  getInventoryStats,
  searchInventory,
} = require('../controllers/inventoryController');

const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Public routes (no auth required)
router.get('/', getAllInventory);
router.get('/search', searchInventory);
router.get('/stats', getInventoryStats);
router.get('/low-stock', getLowStockItems);
router.get('/expired', getExpiredItems);
router.get('/expiring-soon', getExpiringItems);
router.get('/:id', getInventoryById);

// Protected routes (auth required)
router.post('/', verifyToken, authorizeRoles('admin', 'it'), createInventory);
router.put('/:id', verifyToken, authorizeRoles('admin', 'it'), updateInventory);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'it'), deleteInventory);

module.exports = router;