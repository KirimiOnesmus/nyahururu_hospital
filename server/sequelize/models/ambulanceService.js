"use strict";

module.exports = (sequelize, DataTypes) => sequelize.define("AmbulanceService", {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  importKey: { type: DataTypes.STRING(100), allowNull: true, unique: true },
  name: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { notEmpty: true } },
  description: { type: DataTypes.TEXT, allowNull: true },
  cashPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: true, validate: { min: 0 } },
  shaPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: true, validate: { min: 0 } },
  shaCovered: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  lastImportBatchId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
}, {
  tableName: "ambulance_services",
  validate: {
    shaPriceMatchesCoverage() {
      if (this.shaCovered && this.shaPrice == null) throw new Error("Enter the SHA price for a covered ambulance service.");
      if (!this.shaCovered && this.shaPrice != null) throw new Error("An ambulance service not covered by SHA cannot have an SHA price.");
    },
  },
  indexes: [{ fields: ["is_active", "sort_order"] }, { fields: ["last_import_batch_id"] }],
});
