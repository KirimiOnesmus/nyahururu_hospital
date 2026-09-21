"use strict";

const EMERGENCY_LEVELS = ["standard", "urgent", "critical"];
const BOOKING_STATUSES = [
  "Pending",
  "Assigned",
  "In Transit",
  "Arrived",
  "Completed",
  "Cancelled",
  "Waiting",
];

module.exports = (sequelize, DataTypes) => {
  const AmbulanceBooking = sequelize.define(
    "AmbulanceBooking",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      patientName: { type: DataTypes.STRING(150), allowNull: false },
      phone: { type: DataTypes.STRING(30), allowNull: false },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmailIfPresent(value) {
            if (value && !/^\S+@\S+\.\S+$/.test(value)) {
              throw new Error("Invalid email address");
            }
          },
        },
        set(value) {
          this.setDataValue("email", value ? value.trim().toLowerCase() : value);
        },
      },
      currentLocation: { type: DataTypes.STRING(500), allowNull: false },
      destinationHospital: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "Not specified",
      },
      emergencyLevel: {
        type: DataTypes.ENUM(...EMERGENCY_LEVELS),
        allowNull: false,
        defaultValue: "standard",
      },
      medicalCondition: { type: DataTypes.TEXT, allowNull: false },
      additionalNotes: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM(...BOOKING_STATUSES),
        allowNull: false,
        defaultValue: "Pending",
      },
      vehicleId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "vehicles", key: "id" },
        // A vehicle can't be deleted while it has bookings pointing at it
        // — enforcing this keeps historical dispatch records honest.
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      userId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      bookingDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      assignedAt: DataTypes.DATE,
      completedAt: DataTypes.DATE,
      cancelledAt: DataTypes.DATE,
      cancelReason: DataTypes.STRING(500),
      estimatedArrival: DataTypes.DATE,
      actualArrival: DataTypes.DATE,
      notes: DataTypes.TEXT,
    },
    {
      tableName: "ambulance_bookings",
      indexes: [
        { fields: ["status"] },
        { fields: ["booking_date"] },
        { fields: ["user_id"] },
        { fields: ["vehicle_id"] },
        { fields: ["emergency_level"] },
      ],
    },
  );

  AmbulanceBooking.associate = (models) => {
    AmbulanceBooking.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    AmbulanceBooking.belongsTo(models.Vehicle, { foreignKey: "vehicleId", as: "vehicle" });
  };

  AmbulanceBooking.EMERGENCY_LEVELS = EMERGENCY_LEVELS;
  AmbulanceBooking.STATUSES = BOOKING_STATUSES;

  return AmbulanceBooking;
};
