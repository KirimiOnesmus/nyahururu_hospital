"use strict";

const VEHICLE_TYPES = ["Ambulance", "Service Van", "Delivery Truck", "Staff Transport"];
const VEHICLE_STATUSES = ["Available", "In Use", "Maintenance"];

module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define(
    "Vehicle",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      plate: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        // Mongoose had `uppercase: true`; MySQL has no built-in equivalent,
        // so normalise here. Also trims to catch trailing whitespace from
        // pasted values.
        set(value) {
          this.setDataValue("plate", value ? value.trim().toUpperCase() : value);
        },
        validate: { notEmpty: { msg: "Plate is required" } },
      },
      type: {
        type: DataTypes.ENUM(...VEHICLE_TYPES),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...VEHICLE_STATUSES),
        allowNull: false,
        defaultValue: "Available",
      },
      driver: DataTypes.STRING(150),
      lastService: DataTypes.DATE,
      nextService: DataTypes.DATE,
      mileage: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      color: DataTypes.STRING(50),
      make: DataTypes.STRING(80),
      model: DataTypes.STRING(80),
      year: DataTypes.INTEGER,
      registrationExpiry: DataTypes.DATE,
      insuranceExpiry: DataTypes.DATE,
      notes: DataTypes.TEXT,
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
      tableName: "vehicles",
      indexes: [
        { unique: true, fields: ["plate"] },
        { fields: ["status"] },
        { fields: ["type"] },
      ],
    },
  );

  Vehicle.associate = (models) => {
    Vehicle.belongsTo(models.User, { foreignKey: "createdBy", as: "creator" });
    Vehicle.belongsTo(models.User, { foreignKey: "updatedBy", as: "updater" });
    if (models.AmbulanceBooking) {
      Vehicle.hasMany(models.AmbulanceBooking, { foreignKey: "vehicleId", as: "bookings" });
    }
  };

  Vehicle.TYPES = VEHICLE_TYPES;
  Vehicle.STATUSES = VEHICLE_STATUSES;

  return Vehicle;
};
