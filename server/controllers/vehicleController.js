"use strict";

const { Op } = require("sequelize");
const { Vehicle, User } = require("../sequelize/models");

// The Mongoose vehicleController also required AmbulanceBooking but
// never referenced it — dead import, dropped on cutover.

// ── Helpers ─────────────────────────────────────────────────────────

const AUTHOR_INCLUDE = [
  { model: User, as: "creator", attributes: ["id", "name", "email"] },
  { model: User, as: "updater", attributes: ["id", "name", "email"] },
];

// The Vehicle model already trims + uppercases `plate` in its setter,
// so downstream comparisons don't need to normalise. The uppercase
// call in the controller is kept for symmetry with the incoming payload
// but is a belt-and-braces safeguard, not a functional requirement.
const normalizePlate = (raw) => (raw ? String(raw).trim().toUpperCase() : raw);

// ── CRUD ────────────────────────────────────────────────────────────

exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      include: AUTHOR_INCLUDE,
      order: [["createdAt", "DESC"]],
    });
    res.json(vehicles);
  } catch (error) {
    console.error("Get all vehicles error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: AUTHOR_INCLUDE,
    });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (error) {
    console.error("Get vehicle error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const {
      plate, type, status, driver, lastService, nextService, mileage,
      color, make, model, year, registrationExpiry, insuranceExpiry, notes,
    } = req.body;

    if (!plate || !type) {
      return res.status(400).json({
        message: "Missing required fields: plate and type",
      });
    }

    const normalizedPlate = normalizePlate(plate);

    // Explicit duplicate check gives a clean 400 rather than a 500 from
    // catching a UniqueConstraintError. Same behaviour the Mongoose
    // version had. The Vehicle model's unique index still protects
    // against races where two concurrent creates slip past this check.
    const existingPlate = await Vehicle.findOne({ where: { plate: normalizedPlate } });
    if (existingPlate) {
      return res.status(400).json({ message: "Vehicle plate already registered" });
    }

    const vehicle = await Vehicle.create({
      plate: normalizedPlate,
      type,
      status: status || "Available",
      driver,
      lastService: lastService ? new Date(lastService) : null,
      nextService: nextService ? new Date(nextService) : null,
      mileage,
      color,
      make,
      model,
      year,
      registrationExpiry: registrationExpiry ? new Date(registrationExpiry) : null,
      insuranceExpiry:   insuranceExpiry   ? new Date(insuranceExpiry)   : null,
      notes,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    res.status(201).json({ message: "Vehicle registered successfully", vehicle });
  } catch (error) {
    console.error("Create vehicle error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    const {
      plate, type, status, driver, lastService, nextService, mileage,
      color, make, model, year, registrationExpiry, insuranceExpiry, notes,
    } = req.body;

    if (plate) {
      const normalized = normalizePlate(plate);
      if (normalized !== vehicle.plate) {
        // Duplicate-plate guard — exclude the current row so re-saving
        // an unchanged plate can't false-positive.
        const existingPlate = await Vehicle.findOne({
          where: { plate: normalized, id: { [Op.ne]: vehicle.id } },
        });
        if (existingPlate) {
          return res.status(400).json({ message: "Vehicle plate already registered" });
        }
        vehicle.plate = normalized;
      }
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
    if (registrationExpiry !== undefined) {
      vehicle.registrationExpiry = registrationExpiry ? new Date(registrationExpiry) : null;
    }
    if (insuranceExpiry !== undefined) {
      vehicle.insuranceExpiry = insuranceExpiry ? new Date(insuranceExpiry) : null;
    }
    if (notes !== undefined) vehicle.notes = notes;

    vehicle.updatedBy = req.user?.id;

    await vehicle.save();

    res.json({ message: "Vehicle updated successfully", vehicle });
  } catch (error) {
    console.error("Update vehicle error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    // NOTE: ambulance_bookings.vehicle_id → vehicles(id) uses ON DELETE
    // RESTRICT (an ambulance can't be dispatched to a nonexistent
    // vehicle). If the vehicle has active dispatches, the DELETE below
    // will fail with a ForeignKeyConstraintError — caught by the outer
    // try/catch and reported to the client with a 500. If we later
    // want a cleaner 409 here, catch that specific error name.
    await vehicle.destroy();

    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Delete vehicle error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAvailableVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { status: "Available" },
      order: [["plate", "ASC"]],
    });
    res.json(vehicles);
  } catch (error) {
    console.error("Get available vehicles error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMaintenanceDueVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { nextService: { [Op.lte]: new Date() } },
      order: [["nextService", "ASC"]],
    });
    res.json(vehicles);
  } catch (error) {
    console.error("Get maintenance due vehicles error:", error);
    res.status(500).json({ message: error.message });
  }
};
