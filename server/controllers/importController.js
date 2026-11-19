"use strict";

const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const { verifyToken } = require("../middleware/auth");
const handlers = require("../services/import/importService");
const importConfig = require("../services/import/config");

const router = express.Router();
const uploadLimit = importConfig.IMPORT_MAX_FILE_BYTES;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: uploadLimit, files: 1, fields: 3, parts: 4 } });
const skipRateLimit = (req) => req.user?.role === "superadmin";
const perUser = (max, windowMs) => rateLimit({
  windowMs,
  limit: max,
  skip: skipRateLimit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ? `user:${req.user.id}` : ipKeyGenerator(req.ip),
  handler: (_req, res) => res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message: "Too many import requests. Please wait and try again." } }),
});
const readLimit = perUser(30, 60 * 1000);
const validateLimit = perUser(importConfig.IMPORT_RATE_VALIDATE_PER_MIN, 60 * 1000);
const commitLimit = perUser(importConfig.IMPORT_RATE_COMMIT_PER_MIN, 60 * 1000);
const requireSuperadmin = (req, res, next) => {
  if (req.user?.role !== "superadmin") return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only the superadmin can use bulk import." } });
  next();
};
const requireCsrfHeader = (req, res, next) => {
  if (req.get("X-Import-Request") !== "true") return res.status(403).json({ success: false, error: { code: "CSRF_REJECTED", message: "The import request could not be verified." } });
  next();
};
const requireFreshAuth = (req, res, next) => {
  // Access tokens are refreshed without a password prompt. Use the database's
  // last successful password login time so refresh cannot renew this window.
  const lastLoginAt = req.user?.lastLogin ? new Date(req.user.lastLogin).getTime() : 0;
  const maxAge = importConfig.IMPORT_FRESH_AUTH_MINUTES_T1 * 60 * 1000;
  if (!lastLoginAt || !Number.isFinite(lastLoginAt) || Date.now() - lastLoginAt > maxAge || lastLoginAt > Date.now() + 30_000) return res.status(401).json({ success: false, error: { code: "FRESH_AUTH_REQUIRED", message: "Please sign in again before confirming this import." } });
  next();
};
const noStore = (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); };
router.param("batchId", (req, res, next, value) => {
  if (!/^[1-9]\d*$/.test(value)) return res.status(400).json({ success: false, error: { code: "INVALID_BATCH_ID", message: "Import batch id must be a positive integer." } });
  next();
});
router.use(noStore, verifyToken, requireSuperadmin);

router.get("/entities", readLimit, handlers.listEntities);
router.get("/entities/:entity/template", readLimit, handlers.template);
router.post("/:entity/validate", requireCsrfHeader, validateLimit, upload.single("file"), handlers.validate);
router.get("/", readLimit, handlers.history);
router.get("/:batchId/errors.csv", readLimit, handlers.errorsCsv);
router.get("/:batchId", readLimit, handlers.detail);
router.post("/:batchId/approve", requireCsrfHeader, commitLimit, (_req, res) => res.status(409).json({ success: false, error: { code: "APPROVAL_NOT_REQUIRED", message: "Tier 1 service imports do not require a second approval." } }));
router.post("/:batchId/commit", requireCsrfHeader, requireFreshAuth, commitLimit, handlers.commit);
router.post("/:batchId/rollback", requireCsrfHeader, requireFreshAuth, commitLimit, handlers.rollback);
router.delete("/:batchId", requireCsrfHeader, commitLimit, handlers.discard);

router.use((error, _req, res, _next) => {
  if (error?.code === "LIMIT_FILE_SIZE") return res.status(413).json({ success: false, error: { code: "FILE_TOO_LARGE", message: "The CSV file exceeds the upload size limit." } });
  if (error instanceof multer.MulterError) return res.status(400).json({ success: false, error: { code: "BAD_UPLOAD", message: "The file upload was not accepted." } });
  return res.status(500).json({ success: false, error: { code: "IMPORT_FAILED", message: "The import request could not be processed." } });
});

router.__test = { requireSuperadmin, requireCsrfHeader, requireFreshAuth, skipRateLimit };
module.exports = router;
