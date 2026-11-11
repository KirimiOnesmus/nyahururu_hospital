"use strict";

const { SystemSetting, sequelize } = require("../sequelize/models");
const { asyncHandler, AppError } = require("../utils/appError");
const logger = require("../utils/logger");

const MAINTENANCE_KEY = "maintenance_mode";
let maintenanceCache = false;
let loadedAt = 0;
let settingsAvailable = true;
let warnedAboutMissingSettings = false;

const isMissingSettingsTable = (error) =>
  error?.original?.code === "ER_NO_SUCH_TABLE" || error?.parent?.code === "ER_NO_SUCH_TABLE";

async function getMaintenanceMode() {
  const refreshAfterMs = settingsAvailable ? 2000 : 30000;
  if (Date.now() - loadedAt > refreshAfterMs) {
    try {
      const setting = await SystemSetting.findByPk(MAINTENANCE_KEY);
      maintenanceCache = setting?.value === "true";
      settingsAvailable = true;
      warnedAboutMissingSettings = false;
      loadedAt = Date.now();
    } catch (error) {
      if (!isMissingSettingsTable(error)) throw error;
      // A missing migration must not take down every API endpoint. Keep normal
      // service available until the settings table has been deployed.
      maintenanceCache = false;
      settingsAvailable = false;
      loadedAt = Date.now();
      if (!warnedAboutMissingSettings) {
        logger.warn("system_settings table is missing; maintenance controls are disabled until migrations run");
        warnedAboutMissingSettings = true;
      }
    }
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
  const maintenanceMode = await getMaintenanceMode();
  return res.json({ success: true, maintenanceMode, settingsAvailable });
});

exports.setMaintenanceMode = asyncHandler(async (req, res) => {
  if (typeof req.body?.enabled !== "boolean") throw new AppError("enabled must be a boolean.", 400);
  try {
    await SystemSetting.upsert({ key: MAINTENANCE_KEY, value: String(req.body.enabled), updatedBy: req.user.id });
  } catch (error) {
    if (isMissingSettingsTable(error)) {
      settingsAvailable = false;
      throw new AppError("System settings are unavailable until the database migrations have run.", 503);
    }
    throw error;
  }
  maintenanceCache = req.body.enabled;
  loadedAt = Date.now();
  return res.json({ success: true, maintenanceMode: maintenanceCache });
});
