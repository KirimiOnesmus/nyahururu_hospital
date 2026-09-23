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

const staffVehicles = [verifyToken, authorizeRoles("admin", "it", "superadmin")];

router.get('/', ...staffVehicles, getAllVehicles);
router.get('/available', ...staffVehicles, getAvailableVehicles);
router.get('/maintenance-due', ...staffVehicles, getMaintenanceDueVehicles);

router.post('/', ...staffVehicles, createVehicle);


router.get('/:id', ...staffVehicles, getVehicleById);
router.put('/:id', ...staffVehicles, updateVehicle);
router.delete('/:id', ...staffVehicles, deleteVehicle);

module.exports = router;