const express = require('express');
const router = express.Router();
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAvailableVehicles,
  getMaintenanceDueVehicles,
} = require('../controllers/vehicleController');

const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Public routes
router.get('/', getAllVehicles);
router.get('/available', getAvailableVehicles);
router.get('/maintenance-due', getMaintenanceDueVehicles);

// Protected routes
router.post('/', verifyToken, authorizeRoles('admin', 'it'), createVehicle);

// Specific vehicle routes (MUST BE LAST)
router.get('/:id', getVehicleById);
router.put('/:id', verifyToken, authorizeRoles('admin', 'it'), updateVehicle);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'it'), deleteVehicle);

module.exports = router;