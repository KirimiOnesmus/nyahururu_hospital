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

const staffInventory = [verifyToken, authorizeRoles("admin", "it", "superadmin")];

router.get('/', ...staffInventory, getAllInventory);
router.get('/search', ...staffInventory, searchInventory);
router.get('/stats', ...staffInventory, getInventoryStats);
router.get('/low-stock', ...staffInventory, getLowStockItems);
router.get('/expired', ...staffInventory, getExpiredItems);
router.get('/expiring-soon', ...staffInventory, getExpiringItems);
router.get('/:id', ...staffInventory, getInventoryById);


router.post('/', ...staffInventory, createInventory);
router.put('/:id', ...staffInventory, updateInventory);
router.delete('/:id', ...staffInventory, deleteInventory);

module.exports = router;