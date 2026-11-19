"use strict";

const { z } = require("zod");
const { AmbulanceService } = require("../sequelize/models");
const audit = require("../services/auditService");
const emitChange = require("../utils/emitChange");
const logger = require("../utils/logger");

const optionalPrice = z.preprocess((value) => value === "" || value == null ? null : Number(value), z.number().min(0).nullable());
const serviceSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(20000).nullable().optional(),
  cashPrice: optionalPrice.optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(65535).optional(),
}).strict();
const publicFields = ["id", "name", "description", "cashPrice", "sortOrder"];

exports.list = async (_req, res) => {
  try {
    const rows = await AmbulanceService.findAll({ where: { isActive: true }, attributes: publicFields, order: [["sortOrder", "ASC"], ["name", "ASC"]] });
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300").json(rows);
  } catch (error) {
    logger.error({ errorName: error.name }, "Could not load ambulance service options");
    res.status(500).json({ message: "Could not load ambulance services." });
  }
};

exports.manageList = async (_req, res) => {
  try {
    const rows = await AmbulanceService.findAll({ order: [["sortOrder", "ASC"], ["name", "ASC"]] });
    res.set("Cache-Control", "no-store").json(rows);
  } catch (error) {
    logger.error({ errorName: error.name }, "Could not load ambulance service catalogue");
    res.status(500).json({ message: "Could not load ambulance service catalogue." });
  }
};

function parseBody(req, partial = false) {
  const input = { ...req.body };
  if (typeof input.isActive === "string") input.isActive = input.isActive === "true";
  if (input.sortOrder != null) input.sortOrder = Number(input.sortOrder);
  return (partial ? serviceSchema.partial() : serviceSchema).safeParse(input);
}

exports.create = async (req, res) => {
  const parsed = parseBody(req);
  if (!parsed.success) return res.status(400).json({ message: "Invalid ambulance service data.", errors: parsed.error.issues.map((item) => ({ field: item.path.join("."), message: item.message })) });
  try {
    const record = await AmbulanceService.create(parsed.data);
    await audit.log({ req, action: "create", resource: "ambulance_services", resourceId: record.id, description: "Created an ambulance service option", severity: "high", changes: { fields: Object.keys(parsed.data) }, required: true });
    res.status(201).json({ message: "Ambulance service option created.", service: record });
    emitChange("ambulance_services", "created", { id: record.id });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ message: "An ambulance service with this name already exists." });
    logger.error({ errorName: error.name }, "Could not create ambulance service");
    res.status(500).json({ message: "Could not create the ambulance service." });
  }
};

exports.update = async (req, res) => {
  const parsed = parseBody(req, true);
  if (!parsed.success) return res.status(400).json({ message: "Invalid ambulance service data.", errors: parsed.error.issues.map((item) => ({ field: item.path.join("."), message: item.message })) });
  try {
    const record = await AmbulanceService.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: "Ambulance service not found." });
    record.set(parsed.data);
    await record.save();
    await audit.log({ req, action: "update", resource: "ambulance_services", resourceId: record.id, description: "Updated an ambulance service option", severity: "high", changes: { fields: Object.keys(parsed.data) }, required: true });
    res.json({ message: "Ambulance service option updated.", service: record });
    emitChange("ambulance_services", "updated", { id: record.id });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") return res.status(409).json({ message: "An ambulance service with this name already exists." });
    logger.error({ errorName: error.name }, "Could not update ambulance service");
    res.status(500).json({ message: "Could not update the ambulance service." });
  }
};

exports.remove = async (req, res) => {
  try {
    const record = await AmbulanceService.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: "Ambulance service not found." });
    await record.destroy();
    await audit.log({ req, action: "delete", resource: "ambulance_services", resourceId: req.params.id, description: "Deleted an ambulance service option", severity: "high", changes: { fields: ["service"] }, required: true });
    res.json({ message: "Ambulance service option deleted." });
    emitChange("ambulance_services", "deleted", { id: req.params.id });
  } catch (error) {
    logger.error({ errorName: error.name }, "Could not delete ambulance service");
    res.status(500).json({ message: "Could not delete the ambulance service." });
  }
};
