"use strict";

const { Service, ServiceItem } = require("../../../sequelize/models");

module.exports = {
  key: "serviceItems",
  label: "Service item prices and SHA coverage",
  tier: 1,
  model: ServiceItem,
  naturalKey: "importKey",
  modes: ["upsert", "create_only", "update_only"],
  maxRows: 500,
  rollback: "full",
  references: [{ column: "department", model: Service, field: "name", attribute: "serviceId" }],
  snapshotFields: ["serviceId", "importKey", "name", "shaCovered", "cashPrice", "shaPrice", "sortOrder", "lastImportBatchId"],
  serverSet: ({ batch }) => ({ lastImportBatchId: batch.id }),
  forbidden: ["id", "createdAt", "updatedAt", "lastImportBatchId"],
  columns: [
    { name: "importKey", attribute: "importKey", type: "string", required: true, max: 100, clearable: false },
    { name: "department", attribute: "serviceId", type: "string", required: true, max: 150, clearable: false },
    { name: "name", attribute: "name", type: "string", required: true, max: 255, clearable: false },
    { name: "shaCovered", attribute: "shaCovered", type: "boolean", required: true, clearable: false },
    { name: "cashPrice", attribute: "cashPrice", type: "money", clearable: true },
    { name: "shaPrice", attribute: "shaPrice", type: "money", clearable: true },
    { name: "sortOrder", attribute: "sortOrder", type: "integer", min: 0, max: 65535, clearable: false },
  ],
};
