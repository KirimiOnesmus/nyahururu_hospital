const emitChange = require("../utils/emitChange");
"use strict";

const fs = require("fs");
const logger = require("../utils/logger");
const path = require("path");
const { Op } = require("sequelize");
const { Service } = require("../sequelize/models");
const { getPagination, buildMeta } = require("../utils/pagination");
const audit = require("../services/auditService");
const { z } = require("zod");

const VALID_DIVISIONS = ["Outpatient", "Inpatient", "Specialist Clinics"];
const serviceAttributes = ["id", "name", "division", "category", "description", "headOfDepartment", "contactInfo", "serviceHours", "location", "tariffInfo", "nhifCovered", "imageUrl", "cashMin", "cashMax", "shaMin", "shaMax", "itemsTotal", "itemsShaCovered", "shaCoverage", "isPublished", "sortOrder", "createdAt", "updatedAt"];
const serviceInputSchema = z.object({
  name: z.string().trim().min(1).max(150),
  division: z.enum(VALID_DIVISIONS),
  category: z.enum(Service.CATEGORIES),
  description: z.string().trim().min(1).max(20000),
  headOfDepartment: z.string().trim().max(150).optional().nullable(),
  contactInfo: z.string().trim().max(255).optional().nullable(),
  serviceHours: z.string().trim().max(150).optional().nullable(),
  location: z.string().trim().max(255).optional().nullable(),
  tariffInfo: z.string().trim().max(2000).optional().nullable(),
  nhifCovered: z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
  isPublished: z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
  sortOrder: z.preprocess((v) => v === "" || v == null ? undefined : Number(v), z.number().int().min(0).max(32767).optional()),
  cashMin: z.preprocess((v) => v === "" || v == null ? undefined : Number(v), z.number().min(0).nullable().optional()),
  cashMax: z.preprocess((v) => v === "" || v == null ? undefined : Number(v), z.number().min(0).nullable().optional()),
  shaMin: z.preprocess((v) => v === "" || v == null ? undefined : Number(v), z.number().min(0).nullable().optional()),
  shaMax: z.preprocess((v) => v === "" || v == null ? undefined : Number(v), z.number().min(0).nullable().optional()),
  itemsTotal: z.preprocess((v) => v === "" || v == null ? undefined : Number(v), z.number().int().min(0).nullable().optional()),
  itemsShaCovered: z.preprocess((v) => v === "" || v == null ? undefined : Number(v), z.number().int().min(0).nullable().optional()),
}).strict();
const serviceConstraintErrors = (values) => {
  const issues = [];
  for (const [minKey, maxKey] of [["cashMin", "cashMax"], ["shaMin", "shaMax"]]) {
    if (values[minKey] != null && values[maxKey] != null && Number(values[minKey]) > Number(values[maxKey])) issues.push(`${minKey} cannot exceed ${maxKey}.`);
  }
  if ((values.itemsTotal == null) !== (values.itemsShaCovered == null)) issues.push("Provide both item counts to calculate SHA coverage.");
  if (values.itemsTotal != null && values.itemsShaCovered != null && values.itemsShaCovered > values.itemsTotal) issues.push("SHA-covered items cannot exceed the total item count.");
  return issues;
};

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
    const input = { ...req.body };
    delete input.image;
    const parsed = serviceInputSchema.safeParse(input);
    if (!parsed.success) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Invalid service data.", errors: parsed.error.issues.map(({ path: p, message }) => ({ field: p.join("."), message })) });
    }
    const {
      name, division, category, description, headOfDepartment, contactInfo,
      serviceHours, location, tariffInfo, nhifCovered, isPublished, sortOrder,
      cashMin, cashMax, shaMin, shaMax, itemsTotal, itemsShaCovered,
    } = parsed.data;
    if (req.file && !req.file.mimetype.startsWith("image/")) {
      deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Only image files are allowed" });
    }
    const constraintErrors = serviceConstraintErrors(parsed.data);
    if (constraintErrors.length) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Invalid pricing or SHA coverage data.", errors: constraintErrors });
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
      isPublished: isPublished === undefined ? true : toBool(isPublished),
      sortOrder: sortOrder ?? 100,
      cashMin, cashMax, shaMin, shaMax, itemsTotal, itemsShaCovered,
    });

    await audit.log({ req, action: "create", resource: "services", resourceId: newService.id, description: "Created a hospital service", severity: "high", changes: { fields: Object.keys(parsed.data) }, required: true });
    res.status(201).json({ message: "Service created successfully", service: newService });
    emitChange("services", "created", { id: newService.id });
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
    if (["SequelizeValidationError", "SequelizeUniqueConstraintError"].includes(error.name)) return res.status(error.name === "SequelizeUniqueConstraintError" ? 409 : 400).json({ message: "Service data is invalid or already exists." });
    logger.error({ err: error }, "Error creating service");
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
};

exports.updateService = async (req, res) => {
  try {
    const input = { ...req.body };
    delete input.image;
    const parsed = serviceInputSchema.partial().safeParse(input);
    if (!parsed.success) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Invalid service data.", errors: parsed.error.issues.map(({ path: p, message }) => ({ field: p.join("."), message })) });
    }
    const {
      name, division, category, description,
      headOfDepartment, contactInfo, serviceHours,
      location, tariffInfo, nhifCovered, isPublished, sortOrder,
      cashMin, cashMax, shaMin, shaMax, itemsTotal, itemsShaCovered,
    } = parsed.data;

    const service = await Service.findByPk(req.params.id);
    if (!service) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(404).json({ message: "Service not found" });
    }

    const constraintErrors = serviceConstraintErrors({ ...service.get({ plain: true }), ...parsed.data });
    if (constraintErrors.length) {
      if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
      return res.status(400).json({ message: "Invalid pricing or SHA coverage data.", errors: constraintErrors });
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
    if (isPublished !== undefined) service.isPublished = toBool(isPublished);
    if (sortOrder !== undefined) service.sortOrder = sortOrder;
    for (const [field, value] of Object.entries({ cashMin, cashMax, shaMin, shaMax, itemsTotal, itemsShaCovered })) {
      if (value !== undefined) service[field] = value;
    }


    if (req.file) {
      deleteImageFile(service.imageUrl);
      service.imageUrl = `/uploads/services/${req.file.filename}`;
    }

    await service.save();

    await audit.log({ req, action: "update", resource: "services", resourceId: service.id, description: "Updated a hospital service", severity: "high", changes: { fields: Object.keys(parsed.data) }, required: true });
    res.json({ message: "Service updated successfully", service });
    emitChange("services", "updated", { id: service.id });
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/services/${req.file.filename}`);
    if (["SequelizeValidationError", "SequelizeUniqueConstraintError"].includes(error.name)) return res.status(error.name === "SequelizeUniqueConstraintError" ? 409 : 400).json({ message: "Service data is invalid or conflicts with an existing service." });
    logger.error({ err: error }, "Error updating service");
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
};

exports.getAllServices = async (req, res) => {
  try {
    const { division, category } = req.query;
    const search = req.query.q ?? req.query.search;
    if (division && division !== "all" && !VALID_DIVISIONS.includes(division)) return res.status(400).json({ message: "Invalid division." });
    if (category && category !== "all" && !Service.CATEGORIES.includes(category)) return res.status(400).json({ message: "Invalid category." });
    if (search != null && (typeof search !== "string" || search.length > 60)) return res.status(400).json({ message: "Search must be 60 characters or fewer." });
    for (const key of ["page", "limit"]) {
      if (req.query[key] != null && (typeof req.query[key] !== "string" || !/^[1-9]\d*$/.test(req.query[key]))) return res.status(400).json({ message: `${key} must be a positive integer.` });
    }
    if (req.query.limit != null && Number(req.query.limit) > 200) return res.status(400).json({ message: "limit cannot exceed 200." });
    const { requestedPaging, page, limit, offset } = getPagination(req.query);
    const where = req.includeUnpublished ? {} : { isPublished: true };
    if (division && division !== "all") where.division = division;
    if (category && category !== "all") where.category = category;
    if (search) {
      const escaped = String(search).replace(/[\\%_]/g, (m) => `\\${m}`);
      where[Op.or] = [
        { name: { [Op.like]: `%${escaped}%` } },
        { description: { [Op.like]: `%${escaped}%` } },
        { headOfDepartment: { [Op.like]: `%${escaped}%` } },
      ];
    }
    const { rows: services, count: total } = await Service.findAndCountAll({
      where,
      attributes: serviceAttributes,
      order: [["sortOrder", "ASC"], ["name", "ASC"]],
      limit: requestedPaging ? limit : undefined,
      offset: requestedPaging ? offset : undefined,
    });
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    if (!requestedPaging) return res.json(services);
    return res.json({ data: services, meta: buildMeta(page, limit, total, services.length, offset) });
  } catch (error) {
    logger.error({ err: error }, "Error fetching services");
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
};

exports.getServiceFilters = async (_req, res) => {
  try {
    const where = { isPublished: true };
    const pairs = await Service.findAll({
      attributes: ["division", "category"],
      where,
      group: ["division", "category"],
      order: [["division", "ASC"], ["category", "ASC"]],
    });
    const categoriesByDivision = {};
    for (const row of pairs) {
      const { division, category } = row.get({ plain: true });
      if (!division || !category) continue;
      categoriesByDivision[division] ||= [];
      categoriesByDivision[division].push(category);
    }
    const [total, outpatient, inpatient, clinics, sha] = await Promise.all([
      Service.count({ where }),
      Service.count({ where: { ...where, division: "Outpatient" } }),
      Service.count({ where: { ...where, division: "Inpatient" } }),
      Service.count({ where: { ...where, division: "Specialist Clinics" } }),
      Service.count({ where: { ...where, nhifCovered: true } }),
    ]);
    return res.json({
      divisions: [...new Set(pairs.map((row) => row.division).filter(Boolean))].sort(),
      categories: [...new Set(pairs.map((row) => row.category).filter(Boolean))].sort(),
      categoriesByDivision,
      stats: { total, outpatient, inpatient, clinics, sha },
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching service filters");
    return res.status(500).json({ message: "Server Error. Please try again later." });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    if (!/^[1-9]\d*$/.test(String(req.params.id))) return res.status(400).json({ message: "Invalid service id." });
    const where = { id: req.params.id };
    if (!req.includeUnpublished) where.isPublished = true;
    const service = await Service.findOne({ where, attributes: serviceAttributes });
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
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

    await audit.log({ req, action: "delete", resource: "services", resourceId: serviceId, description: "Deleted a hospital service", severity: "high", changes: { fields: ["service"] }, required: true });

    if (imageUrl) deleteImageFile(imageUrl);

    res.json({ message: "Service deleted successfully" });
    emitChange("services", "deleted", { id: req.params.id });
  } catch (error) {
    logger.error({ err: error }, "Error deleting service");
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
};
