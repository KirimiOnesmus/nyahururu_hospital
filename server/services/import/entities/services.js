"use strict";

const { Service } = require("../../../sequelize/models");

const string = (max, required = false) => ({ type: "string", max, required, clearable: !required });
const money = { type: "money", clearable: true };
const integer = { type: "integer", min: 0, clearable: true };

module.exports = {
  key: "services",
  label: "Hospital services and departments",
  tier: 1,
  model: Service,
  naturalKey: "name",
  modes: ["upsert", "create_only", "update_only"],
  maxRows: 500,
  rollback: "full",
  snapshotFields: ["name", "division", "category", "description", "tariffInfo", "headOfDepartment", "contactInfo", "serviceHours", "location", "cashMin", "cashMax", "shaMin", "shaMax", "itemsTotal", "itemsShaCovered", "shaCoverage", "nhifCovered", "isPublished", "sortOrder", "lastImportBatchId"],
  serverSet: ({ batch }) => ({ lastImportBatchId: batch.id }),
  defaults: ({ values }) => ["registration", "mortuary", "mortuary services"].includes(String(values.name || "").trim().toLocaleLowerCase("en")) && values.isPublished === undefined
    ? { isPublished: false }
    : {},
  attributes: ["name", "division", "category", "description", "tariffInfo", "headOfDepartment", "contactInfo", "serviceHours", "location", "cashMin", "cashMax", "shaMin", "shaMax", "itemsTotal", "itemsShaCovered", "isPublished", "sortOrder", "shaCoverage", "nhifCovered", "lastImportBatchId"],
  forbidden: ["id", "imageUrl", "nhifCovered", "shaCoverage", "createdAt", "updatedAt", "createdBy", "updatedBy", "lastImportBatchId"],
  columns: [
    { name: "name", attribute: "name", ...string(150, true) },
    { name: "division", attribute: "division", type: "enum", required: true, values: Service.DIVISIONS },
    { name: "category", attribute: "category", type: "enum", required: true, values: Service.CATEGORIES },
    { name: "description", attribute: "description", ...string(20000, true) },
    { name: "tariffInfo", attribute: "tariffInfo", ...string(2000) },
    { name: "headOfDepartment", attribute: "headOfDepartment", ...string(150) },
    { name: "contactInfo", attribute: "contactInfo", ...string(255) },
    { name: "serviceHours", attribute: "serviceHours", ...string(150) },
    { name: "location", attribute: "location", ...string(255) },
    { name: "cashMin", attribute: "cashMin", ...money },
    { name: "cashMax", attribute: "cashMax", ...money },
    { name: "shaMin", attribute: "shaMin", ...money },
    { name: "shaMax", attribute: "shaMax", ...money },
    { name: "itemsTotal", attribute: "itemsTotal", ...integer },
    { name: "itemsShaCovered", attribute: "itemsShaCovered", ...integer },
    { name: "isPublished", attribute: "isPublished", type: "boolean", clearable: false },
    { name: "sortOrder", attribute: "sortOrder", type: "integer", min: 0, max: 32767, clearable: false },
  ],
};
