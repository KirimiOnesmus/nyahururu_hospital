const Vehicle = require('../models/vehicleModel');
const AmbulanceBooking = require('../models/ambulanceBookingModel');

exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(vehicles);
  } catch (error) {
    console.error('Get all vehicles error:', error);
    res.status(500).json({ message: error.message });
  }
};
 
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const { plate, type, status, driver, lastService, nextService, mileage, color, make, model, year, registrationExpiry, insuranceExpiry, notes } = req.body;

    if (!plate || !type) {
      return res.status(400).json({
        message: 'Missing required fields: plate and type',
      });
    }

    // Check if plate already exists
    const existingPlate = await Vehicle.findOne({ plate: plate.toUpperCase() });
    if (existingPlate) {
      return res.status(400).json({ message: 'Vehicle plate already registered' });
    }

    const vehicle = await Vehicle.create({
      plate: plate.toUpperCase(),
      type,
      status: status || 'Available',
      driver,
      lastService: lastService ? new Date(lastService) : null,
      nextService: nextService ? new Date(nextService) : null,
      mileage,
      color,
      make,
      model,
      year,
      registrationExpiry: registrationExpiry ? new Date(registrationExpiry) : null,
      insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
      notes,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    res.status(201).json({
      message: 'Vehicle registered successfully',
      vehicle,
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const { plate, type, status, driver, lastService, nextService, mileage, color, make, model, year, registrationExpiry, insuranceExpiry, notes } = req.body;

    // Check if new plate already exists (and is different)
    if (plate && plate.toUpperCase() !== vehicle.plate) {
      const existingPlate = await Vehicle.findOne({ plate: plate.toUpperCase() });
      if (existingPlate) {
        return res.status(400).json({ message: 'Vehicle plate already registered' });
      }
      vehicle.plate = plate.toUpperCase();
    }

    if (type !== undefined) vehicle.type = type;
    if (status !== undefined) vehicle.status = status;
    if (driver !== undefined) vehicle.driver = driver;
    if (lastService !== undefined) vehicle.lastService = lastService ? new Date(lastService) : null;
    if (nextService !== undefined) vehicle.nextService = nextService ? new Date(nextService) : null;
    if (mileage !== undefined) vehicle.mileage = mileage;
    if (color !== undefined) vehicle.color = color;
    if (make !== undefined) vehicle.make = make;
    if (model !== undefined) vehicle.model = model;
    if (year !== undefined) vehicle.year = year;
    if (registrationExpiry !== undefined) vehicle.registrationExpiry = registrationExpiry ? new Date(registrationExpiry) : null;
    if (insuranceExpiry !== undefined) vehicle.insuranceExpiry = insuranceExpiry ? new Date(insuranceExpiry) : null;
    if (notes !== undefined) vehicle.notes = notes;

    vehicle.updatedBy = req.user?.id;

    const updatedVehicle = await vehicle.save();

    res.json({
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAvailableVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: 'Available' }).sort({ plate: 1 });
    res.json(vehicles);
  } catch (error) {
    console.error('Get available vehicles error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMaintenanceDueVehicles = async (req, res) => {
  try {
    const now = new Date();
    const vehicles = await Vehicle.find({
      nextService: { $lte: now },
    }).sort({ nextService: 1 });

    res.json(vehicles);
  } catch (error) {
    console.error('Get maintenance due vehicles error:', error);
    res.status(500).json({ message: error.message });
  }
};



