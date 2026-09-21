const emitChange = require("../utils/emitChange");
"use strict";

const fs = require("fs");
const logger = require("../utils/logger");
const path = require("path");
const { Op } = require("sequelize");
const { Service } = require("../sequelize/models");
const { getPagination, buildMeta } = require("../utils/pagination");

const VALID_DIVISIONS = ["Outpatient", "Inpatient", "Specialist Clinics"];

const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  const fullPath = path.join(__dirname, "..", imagePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.error(`Failed to delete image: ${err.message}`);
    }
  }
};

const toBool = (value) => value === "true" || value === true;



exports.createService = async (req, res) => {
  try {
    const {
      name, division, category, description,
      headOfDepartment, contactInfo, serviceHours,
      location, tariffInfo, nhifCovered,
    } = req.body;


    if (!name || !name.trim()) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Service name is required" });
    }
    if (!division) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Division is required" });
    }
    if (!category) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Category is required" });
    }
    if (!description || !description.trim()) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Description is required" });
    }
    if (!VALID_DIVISIONS.includes(division)) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({
        message: "Invalid division. Must be Outpatient, Inpatient, or Specialist Clinics",
      });
    }
    if (req.file && !req.file.mimetype.startsWith("image/")) {
      deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Only image files are allowed" });
    }

   
    const existing = await Service.findOne({ where: { name: name.trim() } });
    if (existing) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Service with this name already exists" });
    }

    const imageUrl = req.file ? `/uploads/services/${req.file.filename}` : null;

    const newService = await Service.create({
      name: name.trim(),
      division,
      category,
      description: description.trim(),
      headOfDepartment: headOfDepartment?.trim() || null,
      contactInfo:      contactInfo?.trim()      || null,
      serviceHours:     serviceHours?.trim()     || null,
      location:         location?.trim()         || null,
      tariffInfo:       tariffInfo?.trim()       || null,
      nhifCovered:      toBool(nhifCovered),
      imageUrl,
    });

    res.status(201).json({ message: "Service created successfully", service: newService });
    emitChange("services", "created", { id: newService.id });
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
};

exports.updateService = async (req, res) => {
  try {
    const {
      name, division, category, description,
      headOfDepartment, contactInfo, serviceHours,
      location, tariffInfo, nhifCovered,
    } = req.body;

    const service = await Service.findByPk(req.params.id);
    if (!service) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(404).json({ message: "Service not found" });
    }

    if (name !== undefined && !name.trim()) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Service name cannot be empty" });
    }
    if (description !== undefined && !description.trim()) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Description cannot be empty" });
    }
    if (division && !VALID_DIVISIONS.includes(division)) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({
        message: "Invalid division. Must be Outpatient, Inpatient, or Specialist Clinics",
      });
    }


    if (name && name.trim() !== service.name) {
      const existing = await Service.findOne({
        where: { name: name.trim(), id: { [Op.ne]: service.id } },
      });
      if (existing) {
        if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
        return res.status(400).json({ message: "Service with this name already exists" });
      }
    }

    if (name) service.name = name.trim();
    if (division) service.division = division;
    if (category) service.category = category;
    if (description) service.description = description.trim();
    if (headOfDepartment !== undefined) service.headOfDepartment = headOfDepartment?.trim() || null;
    if (contactInfo !== undefined)      service.contactInfo      = contactInfo?.trim()      || null;
    if (serviceHours !== undefined)     service.serviceHours     = serviceHours?.trim()     || null;
    if (location !== undefined)         service.location         = location?.trim()         || null;
    if (tariffInfo !== undefined)       service.tariffInfo       = tariffInfo?.trim()       || null;
    if (nhifCovered !== undefined)      service.nhifCovered      = toBool(nhifCovered);


    if (req.file) {
      deleteImageFile(service.imageUrl);
      service.imageUrl = `/uploads/services/${req.file.filename}`;
    }

    await service.save();

    res.json({ message: "Service updated successfully", service });
    emitChange("services", "updated", { id: service.id });
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
};

exports.getAllServices = async (req, res) => {
  try {
    const { requestedPaging, page, limit, offset } = getPagination(req.query);
    const { rows: services, count: total } = await Service.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    if (!requestedPaging) return res.json(services);
    return res.json({ data: services, meta: buildMeta(page, limit, total, services.length, offset) });
  } catch (error) {
    logger.error({ err: error }, "Error fetching services");
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
  } catch (error) {
    logger.error({ err: error }, "Error fetching service");
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });


    const imageUrl = service.imageUrl;
    const serviceId = service.id;
    await service.destroy();

    if (imageUrl) deleteImageFile(imageUrl);

    res.json({ message: "Service deleted successfully" });
    emitChange("services", "deleted", { id: req.params.id });
  } catch (error) {
    logger.error({ err: error }, "Error deleting service");
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
};
