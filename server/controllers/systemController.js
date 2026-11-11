"use strict";

const { SystemSetting, sequelize } = require("../sequelize/models");
const { asyncHandler, AppError } = require("../utils/appError");

const MAINTENANCE_KEY = "maintenance_mode";
let maintenanceCache = false;
let loadedAt = 0;

async function getMaintenanceMode() {
  if (Date.now() - loadedAt > 2000) {
    const setting = await SystemSetting.findByPk(MAINTENANCE_KEY);
    maintenanceCache = setting?.value === "true";
    loadedAt = Date.now();
  }
  return maintenanceCache;
}

exports.getMaintenanceMode = getMaintenanceMode;

exports.getSystemHealth = asyncHandler(async (req, res) => {
  let database = "ok";
  try { await sequelize.authenticate(); } catch { database = "unavailable"; }
  let maintenanceMode = null;
  try { maintenanceMode = await getMaintenanceMode(); } catch { /* health must remain available during database outages */ }
  return res.json({ success: true, status: database === "ok" ? "healthy" : "degraded", api: "ok", database, uptimeSeconds: Math.floor(process.uptime()), timestamp: new Date().toISOString(), maintenanceMode });
});

exports.getSystemSettings = asyncHandler(async (req, res) => {
  return res.json({ success: true, maintenanceMode: await getMaintenanceMode() });
});

exports.setMaintenanceMode = asyncHandler(async (req, res) => {
  if (typeof req.body?.enabled !== "boolean") throw new AppError("enabled must be a boolean.", 400);
  await SystemSetting.upsert({ key: MAINTENANCE_KEY, value: String(req.body.enabled), updatedBy: req.user.id });
  maintenanceCache = req.body.enabled;
  loadedAt = Date.now();
  return res.json({ success: true, maintenanceMode: maintenanceCache });
});
