const emitChange = require("../utils/emitChange");
"use strict";
const { Op } = require("sequelize");
const logger = require("../utils/logger");
const { Vehicle, User } = require("../sequelize/models");
const { getPagination, buildMeta } = require("../utils/pagination");
const AUTHOR_INCLUDE = [
  { model: User, as: "creator", attributes: ["id", "name", "email"] },
  { model: User, as: "updater", attributes: ["id", "name", "email"] },
];

const normalizePlate = (raw) => (raw ? String(raw).trim().toUpperCase() : raw);

exports.getAllVehicles = async (req, res) => {
  try {
    const { requestedPaging, page, limit, offset } = getPagination(req.query);
    const { rows: vehicles, count: total } = await Vehicle.findAndCountAll({
      include: AUTHOR_INCLUDE,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    if (!requestedPaging) return res.json(vehicles);
    return res.json({ data: vehicles, meta: buildMeta(page, limit, total, vehicles.length, offset) });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
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
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
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
    emitChange("vehicles", "created", { id: vehicle.id });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
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
    emitChange("vehicles", "updated", { id: vehicle.id });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    await vehicle.destroy();

    res.json({ message: "Vehicle deleted successfully" });
    emitChange("vehicles", "deleted", { id: req.params.id });
  } catch (error) {
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
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
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
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
    logger.error({ err: error }, "Unexpected error");
    res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};
