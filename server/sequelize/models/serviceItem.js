"use strict";

module.exports = (sequelize, DataTypes) => {
  const ServiceItem = sequelize.define("ServiceItem", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    serviceId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: "services", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    importKey: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true } },
    shaCovered: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    cashPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: true, validate: { min: 0 } },
    shaPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: true, validate: { min: 0 } },
    sortOrder: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    lastImportBatchId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  }, {
    tableName: "service_items",
    validate: {
      shaPriceMatchesCoverage() {
        if (this.shaCovered && this.shaPrice == null) throw new Error("Enter the SHA price for a covered service item.");
        if (!this.shaCovered && this.shaPrice != null) throw new Error("An item not covered by SHA cannot have an SHA price.");
      },
    },
    indexes: [
      { fields: ["service_id", "sha_covered", "sort_order"] },
      { fields: ["last_import_batch_id"] },
    ],
  });

  ServiceItem.associate = (models) => {
    ServiceItem.belongsTo(models.Service, { foreignKey: "serviceId", as: "service" });
  };

  return ServiceItem;
};
