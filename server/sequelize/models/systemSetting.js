"use strict";

module.exports = (sequelize, DataTypes) => sequelize.define("SystemSetting", {
  key: { type: DataTypes.STRING(80), primaryKey: true, allowNull: false },
  value: { type: DataTypes.TEXT, allowNull: false },
  updatedBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
}, { tableName: "system_settings" });
