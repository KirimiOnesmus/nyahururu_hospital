"use strict";

const crypto = require("crypto");
const { parse } = require("csv-parse/sync");
const { Op } = require("sequelize");
const { ImportBatch, sequelize } = require("../../sequelize/models");
const audit = require("../auditService");
const logger = require("../../utils/logger");
const importConfig = require("./config");

const definitions = new Map([
  ["services", require("./entities/services")],
  ["serviceItems", require("./entities/serviceItems")],
  ["ambulanceServices", require("./entities/ambulanceServices")],
]);
const unknownEnabledEntities = [...importConfig.enabledEntities].filter((key) => !definitions.has(key));
if (unknownEnabledEntities.length) throw new Error(`Unknown import entity configuration: ${unknownEnabledEntities.join(", ")}`);
const BATCH_FIELDS = ["id", "entity", "tier", "mode", "status", "originalFilename", "fileSha256", "fileSize", "rowCount", "createdCount", "updatedCount", "unchangedCount", "errorCount", "warningCount", "errors", "warnings", "preview", "uploadedBy", "approvedBy", "committedBy", "rolledBackBy", "committedAt", "rolledBackAt", "expiresAt", "createdAt"];

const enabledEntities = () => importConfig.enabledEntities;
const publicBatch = (batch) => Object.fromEntries(BATCH_FIELDS.map((key) => [key, batch[key]]));
const escapeCsv = (value) => {
  let text = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const headersFor = (definition) => definition.columns.map((column) => column.name);
const csvTemplate = (definition) => {
  const header = headersFor(definition);
  const example = header.map((name) => {
    const column = definition.columns.find((item) => item.name === name);
    if (column.required && column.type === "enum") return column.values[0];
    if (column.required) return name === "name" ? "Example department" : "Example description";
    if (column.type === "boolean") return "true";
    if (column.type === "integer") return "0";
    if (column.type === "enum") return column.values[0];
    return "";
  });
  return `${header.map(escapeCsv).join(",")}\r\n${example.map(escapeCsv).join(",")}\r\n`;
};

function enabledDefinition(key) {
  if (!enabledEntities().has(key)) return null;
  return definitions.get(key) || null;
}

function normaliseText(raw, column, row, errors) {
  const value = String(raw).normalize("NFKC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  if (value === "[clear]") {
    if (column.required) errors.push({ row, column: column.name, code: "REQUIRED", message: "This field cannot be cleared." });
    return null;
  }
  if (/<\/?[a-z][^>]*>/i.test(value)) errors.push({ row, column: column.name, code: "HTML_NOT_ALLOWED", message: "HTML markup is not allowed; enter plain text." });
  if (value.length > column.max) errors.push({ row, column: column.name, code: "TOO_LONG", message: `Maximum length is ${column.max} characters.` });
  if (column.required && !value) errors.push({ row, column: column.name, code: "REQUIRED", message: "This field is required." });
  return value || null;
}

function parseCell(raw, column, row, errors) {
  if (raw === undefined || String(raw).trim() === "") {
    if (column.required) errors.push({ row, column: column.name, code: "REQUIRED", message: "This field is required." });
    return undefined;
  }
  if (String(raw).trim() === "[clear]") {
    if (column.required) errors.push({ row, column: column.name, code: "REQUIRED", message: "This field cannot be cleared." });
    else if (column.clearable) return null;
    else errors.push({ row, column: column.name, code: "NOT_CLEARABLE", message: "This field cannot be cleared; provide an explicit value." });
    return undefined;
  }
  if (column.type === "string") return normaliseText(raw, column, row, errors);
  if (column.type === "enum") {
    const value = String(raw).normalize("NFKC").trim();
    if (!column.values.includes(value)) errors.push({ row, column: column.name, code: "INVALID_ENUM", message: `Allowed values: ${column.values.join(", ")}.` });
    return value;
  }
  if (column.type === "boolean") {
    const value = String(raw).trim();
    if (value !== "true" && value !== "false") errors.push({ row, column: column.name, code: "INVALID_BOOLEAN", message: "Use exactly true or false." });
    return value === "true";
  }
  if (column.type === "integer") {
    const value = String(raw).trim();
    if (!/^\d+$/.test(value)) errors.push({ row, column: column.name, code: "INVALID_INTEGER", message: "Use a whole number greater than or equal to zero." });
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < (column.min ?? 0) || (column.max != null && number > column.max)) errors.push({ row, column: column.name, code: "OUT_OF_RANGE", message: `Value must be from ${column.min ?? 0} to ${column.max ?? "the maximum supported value"}.` });
    return number;
  }
  if (column.type === "money") {
    const value = String(raw).trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) errors.push({ row, column: column.name, code: "INVALID_MONEY", message: "Use a non-negative number with up to two decimal places." });
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) errors.push({ row, column: column.name, code: "OUT_OF_RANGE", message: "Value must be zero or greater." });
    return number;
  }
  return raw;
}

async function validateRows(definition, rows, mode) {
  const errors = [];
  const seen = new Set();
  const normalized = [];
  const preview = [];
  let createdCount = 0, updatedCount = 0, unchangedCount = 0;
  let indexedExisting = null;
  const referenceLookups = new Map();
  for (const reference of definition.references || []) {
    const keys = [...new Set(rows.map((row) => String(row[reference.column] ?? "").normalize("NFKC").trim()).filter(Boolean))];
    const records = keys.length ? await reference.model.findAll({ where: { [reference.field]: { [Op.in]: keys } } }) : [];
    referenceLookups.set(reference.column, new Map(records.map((record) => [String(record[reference.field]).normalize("NFKC").trim().toLocaleLowerCase("en"), record])));
  }
  if (typeof definition.model.findAll === "function") {
    const keyColumn = definition.columns.find((column) => column.attribute === definition.naturalKey);
    const keys = [...new Set(rows.map((row) => String(row[keyColumn?.name] ?? "").normalize("NFKC").trim()).filter(Boolean))];
    const records = keys.length ? await definition.model.findAll({ where: { [definition.naturalKey]: { [Op.in]: keys } } }) : [];
    indexedExisting = new Map(records.map((record) => [String(record[definition.naturalKey]).normalize("NFKC").trim().toLocaleLowerCase("en"), record]));
  }
  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const raw = rows[index];
    const values = {};
    for (const column of definition.columns) {
      const value = parseCell(raw[column.name], column, rowNumber, errors);
      if (value === undefined) continue;
      const reference = (definition.references || []).find((item) => item.column === column.name);
      if (reference) {
        const record = referenceLookups.get(column.name)?.get(String(value).normalize("NFKC").trim().toLocaleLowerCase("en"));
        if (!record) errors.push({ row: rowNumber, column: column.name, code: "REFERENCE_NOT_FOUND", message: `No matching ${reference.field} record was found.` });
        else values[column.attribute] = record.id;
      } else values[column.attribute] = value;
    }
    const key = String(values[definition.naturalKey] ?? "").trim().toLocaleLowerCase("en");
    if (key && definition.blockedNames?.includes(key)) errors.push({ row: rowNumber, column: definition.naturalKey, code: "EXCLUDED_RECORD", message: "This catalogue record is excluded from the services import." });
    if (key && seen.has(key)) errors.push({ row: rowNumber, column: definition.naturalKey, code: "DUPLICATE_KEY", message: "This natural key appears more than once in the file." });
    if (key) seen.add(key);
    const existing = key ? indexedExisting
      ? indexedExisting.get(key) || null
      : await definition.model.findOne({ where: { [definition.naturalKey]: values[definition.naturalKey] } })
      : null;
    if (!existing && definition.defaults) Object.assign(values, definition.defaults({ values, row: raw }));
    if (mode === "create_only" && existing) errors.push({ row: rowNumber, column: definition.naturalKey, code: "ALREADY_EXISTS", message: "A record with this name already exists." });
    if (mode === "update_only" && !existing) errors.push({ row: rowNumber, column: definition.naturalKey, code: "NOT_FOUND", message: "No existing record matches this name." });
    let action = existing ? "update" : "create";
    const changedFields = existing ? Object.entries(values).filter(([field, value]) => String(existing[field] ?? "") !== String(value ?? "")).map(([field]) => field) : Object.keys(values);
    const effective = { ...(existing?.get({ plain: true }) || {}), ...values };
    if (existing && changedFields.length === 0) action = "unchanged";
    if (action === "create") createdCount += 1;
    else if (action === "update") updatedCount += 1;
    else unchangedCount += 1;
    normalized.push({ row: rowNumber, key: values[definition.naturalKey], action, values, effective, targetId: existing?.id ?? null, targetUpdatedAt: existing?.updatedAt?.toISOString?.() ?? null });
    if (preview.length < 100) preview.push({ row: rowNumber, action, key: values[definition.naturalKey], changedFields: changedFields.slice(0, 30) });
  }
  for (let index = 0; index < normalized.length; index += 1) {
    const values = normalized[index].effective;
    for (const [minKey, maxKey] of [["cashMin", "cashMax"], ["shaMin", "shaMax"]]) {
      if (values[minKey] != null && values[maxKey] != null && values[minKey] > values[maxKey]) errors.push({ row: normalized[index].row, column: maxKey, code: "MIN_EXCEEDS_MAX", message: `${minKey} cannot exceed ${maxKey}.` });
    }
    if (values.itemsTotal != null && values.itemsShaCovered != null && values.itemsShaCovered > values.itemsTotal) errors.push({ row: normalized[index].row, column: "itemsShaCovered", code: "COVERED_EXCEEDS_TOTAL", message: "SHA-covered items cannot exceed the total item count." });
    if ((values.itemsTotal == null) !== (values.itemsShaCovered == null)) errors.push({ row: normalized[index].row, column: "itemsShaCovered", code: "ITEM_COUNTS_INCOMPLETE", message: "Provide both item counts to calculate SHA coverage." });
    if ("shaCovered" in values && normalized[index].effective.shaCovered && normalized[index].effective.shaPrice == null) errors.push({ row: normalized[index].row, column: "shaPrice", code: "SHA_PRICE_REQUIRED", message: "An SHA-covered item must have an SHA price." });
    if ("shaCovered" in values && !normalized[index].effective.shaCovered && normalized[index].effective.shaPrice != null) errors.push({ row: normalized[index].row, column: "shaPrice", code: "SHA_PRICE_NOT_ALLOWED", message: "An item not covered by SHA cannot have an SHA price." });
  }
  return { normalized: normalized.map(({ effective, ...row }) => row), errors: errors.slice(0, 200), errorCount: errors.length, preview, createdCount, updatedCount, unchangedCount };
}

async function createBatch(req, definition, mode, parsed, metadata) {
  const ttlHours = importConfig.IMPORT_BATCH_TTL_HOURS;
  const result = await validateRows(definition, parsed, mode);
  if (result.errorCount === 0 && result.createdCount + result.updatedCount === 0) throw Object.assign(new Error("The CSV has no changes to apply."), { status: 409, code: "NO_CHANGES" });
  const duplicate = await ImportBatch.findOne({ where: { entity: definition.key, fileSha256: metadata.sha256 } });
  const warnings = duplicate ? [{ row: 0, code: "DUPLICATE_FILE", message: "An identical file was submitted before. Review the earlier batch before committing again." }] : [];
  const status = result.errorCount ? "failed" : "validated";
  const batch = await ImportBatch.create({
    entity: definition.key, tier: definition.tier, mode, status,
    originalFilename: metadata.filename.slice(0, 255),
    fileSha256: metadata.sha256, fileSize: metadata.size, rowCount: parsed.length,
    createdCount: result.errors.length ? 0 : result.createdCount,
    updatedCount: result.errors.length ? 0 : result.updatedCount,
    unchangedCount: result.errors.length ? 0 : result.unchangedCount,
    errorCount: result.errorCount, warningCount: warnings.length,
    errors: result.errors, warnings, preview: result.errors.length ? [] : result.preview,
    payload: result.errors.length ? null : result.normalized,
    uploadedBy: req.user.id,
    expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
  });
  return { batch, result };
}

function getDefinition(req, res) {
  const definition = enabledDefinition(req.params.entity);
  if (!definition) {
    res.status(404).json({ success: false, error: { code: "ENTITY_NOT_ENABLED", message: "That import entity is not enabled." } });
    return null;
  }
  return definition;
}

function cleanFilename(name) {
  return String(name || "upload.csv").replace(/[\\/\r\n\0]/g, "_").replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 255) || "upload.csv";
}

function parseCsvText(text) {
  return parse(text, { bom: true, columns: (headers) => {
    if (new Set(headers).size !== headers.length) throw new Error("Duplicate column header");
    return headers;
  }, skip_empty_lines: true, trim: false, relax_column_count: false, max_record_size: 25000 });
}

function checkHeaders(headers, definition) {
  const allowed = new Set(headersFor(definition));
  const unknown = headers.filter((header) => !allowed.has(header));
  const missing = headersFor(definition).filter((header) => !headers.includes(header));
  if (!unknown.length && !missing.length && new Set(headers).size === headers.length) return null;
  const forbidden = unknown.some((header) => definition.forbidden.includes(header));
  return {
    code: forbidden ? "FORBIDDEN_COLUMN" : "BAD_HEADER",
    message: `CSV headers must be exactly: ${headersFor(definition).join(", ")}.`,
  };
}

exports.listEntities = (_req, res) => {
  const items = [...enabledEntities()].map((key) => definitions.get(key)).filter(Boolean).map((definition) => ({
    key: definition.key, label: definition.label, tier: definition.tier, modes: definition.modes,
    maxRows: definition.maxRows, columns: definition.columns.map(({ name, type, required, values, max, min, clearable }) => ({ name, type, required: !!required, clearable: !!clearable, ...(values ? { values } : {}), ...(max ? { max } : {}), ...(min != null ? { min } : {}) })),
  }));
  res.set("Cache-Control", "no-store").json({ success: true, data: items });
};

exports.template = (req, res) => {
  const definition = getDefinition(req, res);
  if (!definition) return;
  res.set("Cache-Control", "no-store").type("text/csv; charset=utf-8").attachment(`${definition.key}-template.csv`).send(csvTemplate(definition));
};

exports.validate = async (req, res) => {
  const definition = getDefinition(req, res);
  if (!definition) return;
  const mode = String(req.query.mode || "upsert");
  if (!definition.modes.includes(mode)) return res.status(400).json({ success: false, error: { code: "INVALID_MODE", message: "The selected import mode is not supported." } });
  if (!req.file?.buffer) return res.status(400).json({ success: false, error: { code: "FILE_REQUIRED", message: "Choose a CSV file to validate." } });
  if (!/\.csv$/i.test(req.file.originalname)) return res.status(415).json({ success: false, error: { code: "UNSUPPORTED_FILE", message: "Upload a .csv file." } });
  if (!new Set(["text/csv", "application/csv", "application/vnd.ms-excel", "application/octet-stream"]).has(req.file.mimetype)) return res.status(415).json({ success: false, error: { code: "UNSUPPORTED_FILE", message: "The uploaded file must be a CSV document." } });
  if (req.file.buffer.includes(0)) return res.status(415).json({ success: false, error: { code: "UNSUPPORTED_FILE", message: "The file is not valid UTF-8 CSV text." } });
  let text;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(req.file.buffer); }
  catch { return res.status(415).json({ success: false, error: { code: "UNSUPPORTED_FILE", message: "The file must use UTF-8 encoding." } }); }
  let rows;
  try { rows = parseCsvText(text); }
  catch {
    return res.status(400).json({ success: false, error: { code: "BAD_CSV", message: "The CSV structure is invalid. Check quotes, delimiters and row lengths." } });
  }
  if (!rows.length) return res.status(400).json({ success: false, error: { code: "EMPTY_FILE", message: "The CSV has no data rows." } });
  if (rows.length > definition.maxRows) return res.status(422).json({ success: false, error: { code: "TOO_MANY_ROWS", message: `The maximum is ${definition.maxRows} rows per batch.` } });
  const headers = Object.keys(rows[0]);
  const headerError = checkHeaders(headers, definition);
  if (headerError) return res.status(400).json({ success: false, error: headerError });
  const sha256 = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
  try {
    const { batch, result } = await createBatch(req, definition, mode, rows, { filename: cleanFilename(req.file.originalname), sha256, size: req.file.size });
    await audit.log({ req, action: result.errorCount ? "IMPORT_VALIDATE_FAILED" : "IMPORT_VALIDATE", resource: definition.key, resourceId: batch.id, description: `Validated ${rows.length} ${definition.key} rows`, severity: "high", changes: { rows: rows.length, errors: result.errorCount }, metadata: { fileSha256: sha256, fileSize: req.file.size, mode }, required: true });
    const data = { batchId: batch.id, entity: definition.key, tier: definition.tier, mode, status: batch.status, summary: { rows: batch.rowCount, create: batch.createdCount, update: batch.updatedCount, unchanged: batch.unchangedCount, errors: batch.errorCount, warnings: batch.warningCount }, preview: batch.preview, errors: batch.errors, expiresAt: batch.expiresAt };
    return res.status(result.errorCount ? 422 : 201).json({ success: true, data });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, error: { code: error.code, message: error.message } });
    logger.error({ errorName: error.name, entity: definition.key }, "Import validation failed unexpectedly");
    return res.status(500).json({ success: false, error: { code: "IMPORT_FAILED", message: "Could not validate the CSV. Please try again." } });
  }
};

exports.history = async (req, res) => {
  const validStatuses = new Set(["failed", "validated", "awaiting_approval", "committed", "discarded", "rolled_back", "expired"]);
  if (req.query.entity != null && (typeof req.query.entity !== "string" || req.query.entity.length > 60)) return res.status(400).json({ success: false, error: { code: "INVALID_QUERY", message: "Invalid entity filter." } });
  if (req.query.status != null && (typeof req.query.status !== "string" || !validStatuses.has(req.query.status))) return res.status(400).json({ success: false, error: { code: "INVALID_QUERY", message: "Invalid batch status filter." } });
  if ([req.query.page, req.query.limit].some((value) => value != null && !/^\d+$/.test(String(value)))) return res.status(400).json({ success: false, error: { code: "INVALID_QUERY", message: "Page and limit must be positive integers." } });
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const where = {};
  if (req.query.entity) where.entity = String(req.query.entity);
  if (req.query.status) where.status = String(req.query.status);
  try {
    const { rows, count } = await ImportBatch.findAndCountAll({ where, attributes: BATCH_FIELDS, order: [["createdAt", "DESC"]], limit, offset: (page - 1) * limit });
    return res.json({ success: true, data: rows.map(publicBatch), meta: { page, limit, total: count, pages: Math.ceil(count / limit) } });
  } catch (error) { logger.error({ errorName: error.name }, "Failed loading import history"); return res.status(500).json({ success: false, error: { code: "IMPORT_FAILED", message: "Could not load import history." } }); }
};

exports.detail = async (req, res) => {
  const batch = await ImportBatch.findByPk(req.params.batchId);
  if (!batch) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Import batch not found." } });
  return res.json({ success: true, data: { ...publicBatch(batch), preview: batch.preview, errors: batch.errors, warnings: batch.warnings } });
};

exports.errorsCsv = async (req, res) => {
  const batch = await ImportBatch.findByPk(req.params.batchId, { attributes: ["id", "errors"] });
  if (!batch) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Import batch not found." } });
  const rows = [["row", "column", "code", "message"], ...(batch.errors || []).map((error) => [error.row, error.column, error.code, error.message])];
  res.set("Cache-Control", "no-store").type("text/csv; charset=utf-8").attachment(`import-${batch.id}-errors.csv`).send(rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n"));
};

exports.commit = async (req, res) => {
  const id = req.params.batchId;
  let changed = false;
  try {
    const result = await sequelize.transaction(async (transaction) => {
      const batch = await ImportBatch.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!batch) throw Object.assign(new Error("Import batch not found."), { status: 404, code: "NOT_FOUND" });
      if (batch.status !== "validated" || !batch.payload) throw Object.assign(new Error("This batch is not ready to commit."), { status: 409, code: "BATCH_NOT_VALIDATED" });
      if (new Date(batch.expiresAt).getTime() <= Date.now()) {
        batch.status = "expired"; batch.payload = null; await batch.save({ transaction });
        return { expired: true, batchId: batch.id };
      }
      const definition = enabledDefinition(batch.entity);
      if (!definition) throw Object.assign(new Error("Import entity is no longer enabled."), { status: 409, code: "ENTITY_DISABLED" });
      const Model = definition.model;
      if (req.body?.confirm !== true) throw Object.assign(new Error("Confirm the import before committing."), { status: 400, code: "CONFIRMATION_REQUIRED" });
      const rows = batch.payload;
      const snapshot = { created: [], updated: [] };
      let created = 0, updated = 0;
      for (const row of rows) {
        if (row.action === "unchanged") continue;
        let record = row.targetId ? await Model.findByPk(row.targetId, { transaction, lock: transaction.LOCK.UPDATE }) : null;
        if (row.targetId && (!record || record.updatedAt?.toISOString?.() !== row.targetUpdatedAt)) throw Object.assign(new Error(`Data changed since validation (row ${row.row}). Validate the CSV again.`), { status: 409, code: "STALE_DATA" });
        if (!row.targetId && await Model.findOne({ where: { [definition.naturalKey]: row.key }, transaction, lock: transaction.LOCK.UPDATE })) throw Object.assign(new Error(`A matching record was created since validation (row ${row.row}). Validate the CSV again.`), { status: 409, code: "STALE_DATA" });
        if (record) {
          const before = Object.fromEntries(definition.snapshotFields.map((field) => [field, record[field]]));
          const data = { ...row.values, ...(definition.serverSet ? definition.serverSet({ req, batch, row }) : {}) };
          record.set(data);
          await record.save({ transaction, hooks: true, individualHooks: true });
          snapshot.updated.push({ id: record.id, before, committedUpdatedAt: record.updatedAt.toISOString() });
          updated += 1;
        } else {
          record = await Model.create({ ...row.values, ...(definition.serverSet ? definition.serverSet({ req, batch, row }) : {}) }, { transaction, hooks: true, individualHooks: true });
          snapshot.created.push({ id: record.id, committedUpdatedAt: record.updatedAt.toISOString() });
          created += 1;
        }
      }
      batch.status = "committed"; batch.createdCount = created; batch.updatedCount = updated; batch.beforeSnapshot = snapshot;
      batch.committedBy = req.user.id; batch.committedAt = new Date(); batch.payload = null;
      await batch.save({ transaction });
      await audit.log({ req, action: "IMPORT_COMMIT", resource: batch.entity, resourceId: batch.id, description: `Committed ${batch.rowCount} ${batch.entity} rows`, severity: "high", changes: { created, updated, unchanged: batch.unchangedCount, rows: rows.filter((row) => row.action !== "unchanged").map((row) => ({ row: row.row, fields: Object.keys(row.values) })) }, metadata: { fileSha256: batch.fileSha256, fileSize: batch.fileSize, rowCount: batch.rowCount, mode: batch.mode }, transaction, required: true });
      changed = true;
      return { batchId: batch.id, entity: batch.entity, status: batch.status, created, updated, unchanged: batch.unchangedCount };
    });
    if (result.expired) return res.status(410).json({ success: false, error: { code: "BATCH_EXPIRED", message: "This import batch has expired." } });
    if (changed) require("../../utils/emitChange")(result.entity, "bulk_updated", { batchId: id, ...result });
    return res.json({ success: true, data: result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, error: { code: error.code, message: error.message } });
    logger.error({ errorName: error.name, batchId: id }, "Import commit failed");
    return res.status(500).json({ success: false, error: { code: "IMPORT_FAILED", message: "The import could not be committed. No partial changes were saved." } });
  }
};

exports.rollback = async (req, res) => {
  try {
    const result = await sequelize.transaction(async (transaction) => {
      const batch = await ImportBatch.findByPk(req.params.batchId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!batch) throw Object.assign(new Error("Import batch not found."), { status: 404, code: "NOT_FOUND" });
      const definition = enabledDefinition(batch.entity);
      if (batch.status !== "committed" || !definition || definition.rollback !== "full" || !batch.beforeSnapshot) throw Object.assign(new Error("This batch cannot be rolled back."), { status: 409, code: "ROLLBACK_UNSUPPORTED" });
      const retentionDays = importConfig.IMPORT_SNAPSHOT_RETENTION_DAYS;
      if (batch.committedAt && Date.now() - new Date(batch.committedAt).getTime() > retentionDays * 24 * 60 * 60 * 1000) throw Object.assign(new Error("The rollback window for this batch has expired."), { status: 409, code: "ROLLBACK_EXPIRED" });
      const Model = definition.model;
      const snapshot = batch.beforeSnapshot;
      const restore = [];
      for (const item of snapshot.created) {
        const record = await Model.findByPk(item.id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!record || record.updatedAt?.toISOString?.() !== item.committedUpdatedAt) throw Object.assign(new Error("A record changed after this import; rollback would overwrite newer data."), { status: 409, code: "ROLLBACK_CONFLICT" });
        await record.destroy({ transaction });
      }
      for (const item of snapshot.updated) {
        const record = await Model.findByPk(item.id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!record || record.updatedAt?.toISOString?.() !== item.committedUpdatedAt) throw Object.assign(new Error("A record changed after this import; rollback would overwrite newer data."), { status: 409, code: "ROLLBACK_CONFLICT" });
        restore.push({ record, before: item.before });
      }
      for (const item of restore) { item.record.set(item.before); await item.record.save({ transaction, hooks: true, individualHooks: true }); }
      batch.status = "rolled_back"; batch.rolledBackBy = req.user.id; batch.rolledBackAt = new Date();
      await batch.save({ transaction });
      await audit.log({ req, action: "IMPORT_ROLLBACK", resource: batch.entity, resourceId: batch.id, description: `Rolled back ${batch.entity} import`, severity: "high", changes: { createdRemoved: snapshot.created.length, updatedRestored: snapshot.updated.length, rows: [...snapshot.created.map((item) => ({ id: item.id, action: "removed_created_row" })), ...snapshot.updated.map((item) => ({ id: item.id, action: "restored_previous_values", fields: Object.keys(item.before) }))] }, metadata: { fileSha256: batch.fileSha256 }, transaction, required: true });
      return { batchId: batch.id, entity: batch.entity, status: batch.status, createdRemoved: snapshot.created.length, updatedRestored: snapshot.updated.length };
    });
    require("../../utils/emitChange")(result.entity, "bulk_updated", { batchId: req.params.batchId, ...result });
    return res.json({ success: true, data: result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, error: { code: error.code, message: error.message } });
    logger.error({ errorName: error.name, batchId: req.params.batchId }, "Import rollback failed");
    return res.status(500).json({ success: false, error: { code: "IMPORT_FAILED", message: "Rollback failed. No partial changes were saved." } });
  }
};

exports.discard = async (req, res) => {
  const batch = await ImportBatch.findByPk(req.params.batchId);
  if (!batch) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Import batch not found." } });
  if (!["validated", "awaiting_approval", "failed"].includes(batch.status)) return res.status(409).json({ success: false, error: { code: "BATCH_NOT_DISCARDABLE", message: "This batch can no longer be discarded." } });
  batch.status = "discarded"; batch.payload = null;
  await batch.save();
  await audit.log({ req, action: "IMPORT_DISCARD", resource: batch.entity, resourceId: batch.id, description: "Discarded an import batch", severity: "high", changes: { rows: batch.rowCount }, metadata: { fileSha256: batch.fileSha256 }, required: true });
  return res.json({ success: true, data: { batchId: batch.id, status: batch.status } });
};

exports.__test = { parseCell, validateRows, csvTemplate, escapeCsv, parseCsvText, checkHeaders };
