"use strict";

const BLOOD_GROUP_VALUES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

module.exports = (sequelize, DataTypes) => {
  const UrgentBloodRequest = sequelize.define(
    "UrgentBloodRequest",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      // A request can name several blood groups at once (e.g. "O+ and O-
      // urgently needed"). Stored as a JSON array — fixed 8-value domain,
      // never used in a WHERE join, and always fetched wholesale. Group
      // membership is validated at the app layer below since MySQL can't
      // constrain enum-inside-JSON.
      bloodGroups: {
        type: DataTypes.JSON,
        allowNull: false,
        validate: {
          isValidBloodGroupList(value) {
            if (!Array.isArray(value) || value.length === 0) {
              throw new Error("bloodGroups must be a non-empty array");
            }
            const invalid = value.filter((g) => !BLOOD_GROUP_VALUES.includes(g));
            if (invalid.length > 0) {
              throw new Error(
                `bloodGroups contains invalid value(s): ${invalid.join(", ")}. ` +
                  `Allowed: ${BLOOD_GROUP_VALUES.join(", ")}`,
              );
            }
          },
        },
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
      contactNumber: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: { notEmpty: true },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "urgent_blood_requests",
      indexes: [
        { fields: ["is_active"] },
        { fields: ["created_at"] },
      ],
    },
  );

  UrgentBloodRequest.associate = (models) => {
    UrgentBloodRequest.belongsTo(models.User, { foreignKey: "createdBy", as: "creator" });
  };

  UrgentBloodRequest.BLOOD_GROUPS = BLOOD_GROUP_VALUES;

  return UrgentBloodRequest;
};
