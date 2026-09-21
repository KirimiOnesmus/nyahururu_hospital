"use strict";

const CATEGORIES = ["Medicine", "Equipment", "Consumable", "Other"];

module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define(
    "Inventory",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true },
        set(value) {
          this.setDataValue("name", value ? value.trim() : value);
        },
      },
      category: {
        type: DataTypes.ENUM(...CATEGORIES),
        allowNull: false,
        defaultValue: "Other",
      },
      quantity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      // Free-form unit label ("pcs", "boxes", "tablets", "ml", ...)
      unit: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: { notEmpty: true },
        set(value) {
          this.setDataValue("unit", value ? value.trim() : value);
        },
      },
      // Decimal, not float — prices need exact arithmetic. DECIMAL(12,2)
      // handles values up to ~10 billion with 2 decimal places, which is
      // more than enough for medical supplies while dodging binary
      // rounding errors on things like $19.99 * quantity.
      price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      supplier: DataTypes.STRING(200),
      batch: DataTypes.STRING(100),
      expiry: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      minThreshold: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 5,
      },
      description: DataTypes.TEXT,
      // Mongoose `unique: true, sparse: true` → MySQL: unique constraint
      // still allows multiple NULLs (MySQL's default behaviour for unique
      // indexes), so sparse semantics are preserved. Only non-null SKUs
      // are constrained to be unique.
      sku: {
        type: DataTypes.STRING(80),
        allowNull: true,
        unique: true,
      },
      lastRestocked: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      createdBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      updatedBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "inventories",
      indexes: [
        { unique: true, fields: ["sku"] },
        { fields: ["expiry"] },
        { fields: ["quantity"] },
        { fields: ["category"] },
      ],
    },
  );

  Inventory.associate = (models) => {
    Inventory.belongsTo(models.User, { foreignKey: "createdBy", as: "creator" });
    Inventory.belongsTo(models.User, { foreignKey: "updatedBy", as: "updater" });
  };

  Inventory.CATEGORIES = CATEGORIES;

  return Inventory;
};
