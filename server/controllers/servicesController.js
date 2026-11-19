"use strict";

const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const { Op } = require("sequelize");
const { Service, ServiceItem, sequelize } = require("../sequelize/models");
const { getPagination, buildMeta } = require("../utils/pagination");
const audit = require("../services/auditService");
const emitChange = require("../utils/emitChange");
const { z } = require("zod");

const SERVICE_DIVISIONS = Service.DIVISIONS;
const SERVICE_FIELDS = ["id", "name", "division", "category", "description", "imageUrl", "createdAt", "updatedAt"];
const serviceItemSchema = z.object({
  id: z.preprocess((value) => value === "" || value == null ? undefined : Number(value), z.number().int().positive().optional()),
  name: z.string().trim().min(1).max(255),
  shaCovered: z.boolean(),
  cashPrice: z.preprocess((value) => value === "" || value == null ? null : Number(value), z.number().min(0).nullable()),
  shaPrice: z.preprocess((value) => value === "" || value == null ? null : Number(value), z.number().min(0).nullable()),
  sortOrder: z.preprocess((value) => value === "" || value == null ? 0 : Number(value), z.number().int().min(0).max(65535)),
}).strict();
const serviceSchema = z.object({
  name: z.string().trim().min(1).max(150),
  division: z.enum(SERVICE_DIVISIONS),
  category: z.enum(Service.CATEGORIES),
  description: z.string().trim().min(1).max(20000),
  items: z.array(serviceItemSchema).max(2000).optional(),
}).strict();

const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  const fullPath = path.join(__dirname, "..", imagePath);
  if (fs.existsSync(fullPath)) {
    try { fs.unlinkSync(fullPath); }
    catch (error) { logger.warn({ errorName: error.name }, "Could not remove a service image"); }
  }
};

function parseServiceBody(body) {
  const input = { ...body };
  delete input.image;
  if (typeof input.items === "string") {
    try { input.items = JSON.parse(input.items); }
    catch { throw Object.assign(new Error("Service items must be valid JSON."), { status: 400 }); }
  }
  return serviceSchema.safeParse(input);
}

function itemErrors(items = []) {
  const errors = [];
  for (const [index, item] of items.entries()) {
    if (item.shaCovered && item.shaPrice == null) errors.push(`Enter the SHA price for ${item.name}.`);
    if (!item.shaCovered && item.shaPrice != null) errors.push(`${item.name} is not SHA covered and cannot have an SHA price.`);
  }
  return errors;
}

async function attachShaSummary(services) {
  const plain = services.map((record) => record.get ? record.get({ plain: true }) : { ...record });
  const ids = plain.map((service) => service.id);
  if (!ids.length) return plain;
  const coveredRows = await ServiceItem.findAll({
    attributes: ["serviceId"],
    where: { serviceId: { [Op.in]: ids }, shaCovered: true },
    group: ["serviceId"],
  });
  const coveredIds = new Set(coveredRows.map((row) => String(row.serviceId)));
  return plain.map((service) => ({ ...service, hasShaCoverage: coveredIds.has(String(service.id)) }));
}

async function replaceItems(service, incoming, transaction) {
  if (incoming === undefined) return;
  const existing = await ServiceItem.findAll({ where: { serviceId: service.id }, transaction, lock: transaction.LOCK.UPDATE });
  const byId = new Map(existing.map((item) => [String(item.id), item]));
  const retained = new Set();
  for (const itemData of incoming) {
    if (itemData.id) {
      const item = byId.get(String(itemData.id));
      if (!item) throw Object.assign(new Error("A service item does not belong to this department."), { status: 400 });
      item.set({ name: itemData.name, shaCovered: itemData.shaCovered, cashPrice: itemData.cashPrice, shaPrice: itemData.shaPrice, sortOrder: itemData.sortOrder });
      await item.save({ transaction });
      retained.add(String(item.id));
    } else {
      const created = await ServiceItem.create({ serviceId: service.id, name: itemData.name, shaCovered: itemData.shaCovered, cashPrice: itemData.cashPrice, shaPrice: itemData.shaPrice, sortOrder: itemData.sortOrder }, { transaction });
      retained.add(String(created.id));
    }
  }
  const removed = existing.filter((item) => !retained.has(String(item.id)));
  if (removed.length) await ServiceItem.destroy({ where: { id: removed.map((item) => item.id) }, transaction });
}

async function fetchService(id, includeUnpublished = false) {
  const where = { id };
  if (!includeUnpublished) where.isPublished = true;
  return Service.findOne({
    where,
    attributes: SERVICE_FIELDS,
    include: [{ model: ServiceItem, as: "items", attributes: ["id", "name", "shaCovered", "cashPrice", "shaPrice", "sortOrder"], separate: true, order: [["sortOrder", "ASC"], ["name", "ASC"]] }],
  });
}

exports.createService = async (req, res) => {
  try {
    const parsed = parseServiceBody(req.body);
    if (!parsed.success) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Invalid service data.", errors: parsed.error.issues.map(({ path: field, message }) => ({ field: field.join("."), message })) });
    }
    if (req.file && !req.file.mimetype.startsWith("image/")) {
      deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Only image files are allowed." });
    }
    const problems = itemErrors(parsed.data.items);
    if (problems.length) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Review the service items.", errors: problems });
    }
    const created = await sequelize.transaction(async (transaction) => {
      const { items, ...fields } = parsed.data;
      const service = await Service.create({ ...fields, imageUrl: req.file ? `/uploads/services/${req.file.filename}` : null }, { transaction });
      await replaceItems(service, items || [], transaction);
      return service;
    });
    const service = await fetchService(created.id, true);
    await audit.log({ req, action: "create", resource: "services", resourceId: created.id, description: "Created a hospital service category", severity: "high", changes: { fields: Object.keys(parsed.data), itemCount: parsed.data.items?.length || 0 }, required: true });
    res.status(201).json({ message: "Service created successfully.", service });
    emitChange("services", "created", { id: created.id });
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
    if (error.status) return res.status(error.status).json({ message: error.message });
    if (["SequelizeValidationError", "SequelizeUniqueConstraintError"].includes(error.name)) return res.status(error.name === "SequelizeUniqueConstraintError" ? 409 : 400).json({ message: "Service data is invalid or already exists." });
    logger.error({ errorName: error.name }, "Error creating service");
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
};

exports.updateService = async (req, res) => {
  try {
    const input = { ...req.body };
    if (typeof input.items === "string") {
      try { input.items = JSON.parse(input.items); }
      catch { if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`); return res.status(400).json({ message: "Service items must be valid JSON." }); }
    }
    delete input.image;
    const parsed = serviceSchema.partial().safeParse(input);
    if (!parsed.success) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Invalid service data.", errors: parsed.error.issues.map(({ path: field, message }) => ({ field: field.join("."), message })) });
    }
    if (req.file && !req.file.mimetype.startsWith("image/")) {
      deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Only image files are allowed." });
    }
    const problems = itemErrors(parsed.data.items);
    if (problems.length) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Review the service items.", errors: problems });
    }
    let oldImage = null;
    await sequelize.transaction(async (transaction) => {
      const service = await Service.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!service) throw Object.assign(new Error("Service not found."), { status: 404 });
      oldImage = service.imageUrl;
      const { items, ...fields } = parsed.data;
      service.set(fields);
      if (req.file) service.imageUrl = `/uploads/services/${req.file.filename}`;
      await service.save({ transaction });
      await replaceItems(service, items, transaction);
    });
    if (req.file) deleteImageFile(oldImage);
    const service = await fetchService(req.params.id, true);
    await audit.log({ req, action: "update", resource: "services", resourceId: req.params.id, description: "Updated a hospital service category", severity: "high", changes: { fields: Object.keys(parsed.data), itemCount: parsed.data.items?.length }, required: true });
    res.json({ message: "Service updated successfully.", service });
    emitChange("services", "updated", { id: req.params.id });
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
    if (error.status) return res.status(error.status).json({ message: error.message });
    if (["SequelizeValidationError", "SequelizeUniqueConstraintError"].includes(error.name)) return res.status(error.name === "SequelizeUniqueConstraintError" ? 409 : 400).json({ message: "Service data is invalid or conflicts with an existing service." });
    logger.error({ errorName: error.name }, "Error updating service");
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
};

exports.getAllServices = async (req, res) => {
  try {
    const { division, category } = req.query;
    const search = req.query.q ?? req.query.search;
    if (division && division !== "all" && !SERVICE_DIVISIONS.includes(division)) return res.status(400).json({ message: "Invalid division." });
    if (category && category !== "all" && !Service.CATEGORIES.includes(category)) return res.status(400).json({ message: "Invalid category." });
    if (search != null && (typeof search !== "string" || search.length > 60)) return res.status(400).json({ message: "Search must be 60 characters or fewer." });
    for (const key of ["page", "limit"]) if (req.query[key] != null && (typeof req.query[key] !== "string" || !/^[1-9]\d*$/.test(req.query[key]))) return res.status(400).json({ message: `${key} must be a positive integer.` });
    if (req.query.limit != null && Number(req.query.limit) > 200) return res.status(400).json({ message: "limit cannot exceed 200." });
    const { requestedPaging, page, limit, offset } = getPagination(req.query);
    const where = req.includeUnpublished ? {} : { isPublished: true };
    if (division && division !== "all") where.division = division;
    if (category && category !== "all") where.category = category;
    if (search) {
      const escaped = search.replace(/[\\%_]/g, (character) => `\\${character}`);
      where[Op.or] = [{ name: { [Op.like]: `%${escaped}%` } }, { description: { [Op.like]: `%${escaped}%` } }];
    }
    const { rows, count } = await Service.findAndCountAll({
      where,
      attributes: SERVICE_FIELDS,
      order: [["sortOrder", "ASC"], ["name", "ASC"]],
      distinct: true,
      limit: requestedPaging ? limit : undefined,
      offset: requestedPaging ? offset : undefined,
    });
    const services = await attachShaSummary(rows);
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    if (!requestedPaging) return res.json(services);
    return res.json({ data: services, meta: buildMeta(page, limit, count, services.length, offset) });
  } catch (error) {
    logger.error({ errorName: error.name }, "Error fetching services");
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
};

exports.getServiceFilters = async (_req, res) => {
  try {
    const where = { isPublished: true };
    const pairs = await Service.findAll({ attributes: ["division", "category"], where, group: ["division", "category"], order: [["division", "ASC"], ["category", "ASC"]] });
    const categoriesByDivision = {};
    for (const row of pairs) {
      const { division, category } = row.get({ plain: true });
      if (!division || !category) continue;
      categoriesByDivision[division] ||= [];
      categoriesByDivision[division].push(category);
    }
    const [total, outpatient, inpatient, clinics, covered] = await Promise.all([
      Service.count({ where }),
      Service.count({ where: { ...where, division: "Outpatient" } }),
      Service.count({ where: { ...where, division: "Inpatient" } }),
      Service.count({ where: { ...where, division: "Specialist Clinics" } }),
      ServiceItem.findAll({ attributes: ["serviceId"], where: { shaCovered: true }, include: [{ model: Service, as: "service", attributes: [], where }], group: ["serviceId"] }),
    ]);
    return res.json({
      divisions: [...new Set(pairs.map((row) => row.division).filter(Boolean))].sort(),
      categories: [...new Set(pairs.map((row) => row.category).filter(Boolean))].sort(),
      categoriesByDivision,
      stats: { total, outpatient, inpatient, clinics, sha: covered.length },
    });
  } catch (error) {
    logger.error({ errorName: error.name }, "Error fetching service filters");
    return res.status(500).json({ message: "Server Error. Please try again later." });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    if (!/^[1-9]\d*$/.test(String(req.params.id))) return res.status(400).json({ message: "Invalid service id." });
    const service = await fetchService(req.params.id, !!req.includeUnpublished);
    if (!service) return res.status(404).json({ message: "Service not found." });
    const plain = service.get({ plain: true });
    plain.hasShaCoverage = plain.items.some((item) => item.shaCovered);
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300").json(plain);
  } catch (error) {
    logger.error({ errorName: error.name }, "Error fetching service");
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found." });
    const imageUrl = service.imageUrl;
    await service.destroy();
    deleteImageFile(imageUrl);
    await audit.log({ req, action: "delete", resource: "services", resourceId: req.params.id, description: "Deleted a hospital service category", severity: "high", changes: { fields: ["service", "serviceItems"] }, required: true });
    res.json({ message: "Service deleted successfully." });
    emitChange("services", "deleted", { id: req.params.id });
  } catch (error) {
    logger.error({ errorName: error.name }, "Error deleting service");
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
};
