"use strict";

const { Service } = require("../../../sequelize/models");

const string = (max, required = false) => ({ type: "string", max, required, clearable: !required });

module.exports = {
  key: "services",
  label: "Hospital services and departments",
  tier: 1,
  model: Service,
  naturalKey: "name",
  blockedNames: ["registration", "registration service", "mortuary", "mortuary service", "mortuary services", "ambulance", "ambulance service", "ambulance services"],
  modes: ["upsert", "create_only", "update_only"],
  maxRows: 500,
  rollback: "full",
  snapshotFields: ["name", "division", "category", "description", "imageUrl", "isPublished", "sortOrder", "lastImportBatchId"],
  serverSet: ({ batch }) => ({ lastImportBatchId: batch.id }),
  attributes: ["name", "division", "category", "description", "isPublished", "sortOrder", "lastImportBatchId"],
  forbidden: ["id", "imageUrl", "nhifCovered", "shaCoverage", "createdAt", "updatedAt", "createdBy", "updatedBy", "lastImportBatchId", "headOfDepartment", "contactInfo", "location", "cashMin", "cashMax", "shaMin", "shaMax", "itemsTotal", "itemsShaCovered", "sortOrder", "isPublished"],
  columns: [
    { name: "name", attribute: "name", ...string(150, true) },
    { name: "division", attribute: "division", type: "enum", required: true, values: Service.DIVISIONS },
    { name: "category", attribute: "category", type: "enum", required: true, values: Service.CATEGORIES },
    { name: "description", attribute: "description", ...string(20000, true) },
  ],
};
