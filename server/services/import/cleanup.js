"use strict";

const { Op } = require("sequelize");
const { ImportBatch } = require("../../sequelize/models");
const logger = require("../../utils/logger");
const importConfig = require("./config");

async function purgeImportData(now = new Date()) {
  const expired = await ImportBatch.update(
    { status: "expired", payload: null },
    { where: { status: { [Op.in]: ["validated", "awaiting_approval"] }, expiresAt: { [Op.lte]: now } } },
  );
  const retentionDays = importConfig.IMPORT_SNAPSHOT_RETENTION_DAYS;
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  const snapshots = await ImportBatch.update(
    { beforeSnapshot: null },
    { where: { status: { [Op.in]: ["committed", "rolled_back"] }, committedAt: { [Op.lte]: cutoff }, beforeSnapshot: { [Op.ne]: null } } },
  );
  logger.info({ expiredBatches: expired[0], purgedSnapshots: snapshots[0] }, "Import batch cleanup completed");
  return { expiredBatches: expired[0], purgedSnapshots: snapshots[0] };
}

module.exports = { purgeImportData };
