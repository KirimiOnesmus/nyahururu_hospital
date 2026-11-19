"use strict";

const { AmbulanceService } = require("../../../sequelize/models");

module.exports = {
  key: "ambulanceServices",
  label: "Ambulance service and transfer options",
  tier: 1,
  model: AmbulanceService,
  naturalKey: "importKey",
  modes: ["upsert", "create_only", "update_only"],
  maxRows: 500,
  rollback: "full",
  snapshotFields: ["importKey", "name", "description", "cashPrice", "shaPrice", "shaCovered", "isActive", "sortOrder", "lastImportBatchId"],
  serverSet: ({ batch }) => ({ lastImportBatchId: batch.id }),
  forbidden: ["id", "createdAt", "updatedAt", "lastImportBatchId"],
  columns: [
    { name: "importKey", attribute: "importKey", type: "string", required: true, max: 100, clearable: false },
    { name: "name", attribute: "name", type: "string", required: true, max: 255, clearable: false },
    { name: "description", attribute: "description", type: "string", max: 20000 },
    { name: "cashPrice", attribute: "cashPrice", type: "money", clearable: true },
    { name: "shaPrice", attribute: "shaPrice", type: "money", clearable: true },
    { name: "shaCovered", attribute: "shaCovered", type: "boolean", required: true, clearable: false },
    { name: "isActive", attribute: "isActive", type: "boolean", required: true, clearable: false },
    { name: "sortOrder", attribute: "sortOrder", type: "integer", min: 0, max: 65535, clearable: false },
  ],
};
