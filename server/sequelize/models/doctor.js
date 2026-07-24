"use strict";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

module.exports = (sequelize, DataTypes) => {
  const Doctor = sequelize.define(
    "Doctor",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      speciality: DataTypes.STRING(150),
      department: DataTypes.STRING(150),
      bio: {
        type: DataTypes.STRING(1000),
        validate: { len: { args: [0, 1000], msg: "Bio must be at most 1000 characters" } },
      },
      education: DataTypes.STRING(500),

      // Weekly availability as an array of { day, startTime, endTime }.
      // Kept as JSON — never queried relationally (only fetched wholesale
      // for a given doctor). Application-layer validation via the
      // `validate` block below ensures each entry has a valid day and
      // HH:MM times; the DB itself only enforces JSON shape.
      availability: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        validate: {
          isValidAvailability(value) {
            if (!Array.isArray(value)) {
              throw new Error("availability must be an array");
            }
            const timeRe = /^\d{2}:\d{2}$/;
            value.forEach((slot, i) => {
              if (!slot || typeof slot !== "object") {
                throw new Error(`availability[${i}] must be an object`);
              }
              if (!DAYS_OF_WEEK.includes(slot.day)) {
                throw new Error(`availability[${i}].day must be one of ${DAYS_OF_WEEK.join(", ")}`);
              }
              if (!timeRe.test(slot.startTime || "") || !timeRe.test(slot.endTime || "")) {
                throw new Error(`availability[${i}] startTime/endTime must be HH:MM`);
              }
            });
          },
        },
      },
      // isAvailableNow + rating added by migration 20260723100100 —
      // written by doctorController but never declared on the Mongoose
      // schema (silent-drop bug).
      isAvailableNow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      rating: {
        type: DataTypes.DECIMAL(2, 1),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0, max: 5 },
      },
    },
    {
      tableName: "doctors",
      indexes: [
        { unique: true, fields: ["user_id"] },
        { fields: ["speciality"] },
        { fields: ["department"] },
        { fields: ["is_available_now", "rating"] },
      ],
    },
  );

  Doctor.associate = (models) => {
    Doctor.belongsTo(models.User, { foreignKey: "userId", as: "user" });
  };

  Doctor.DAYS_OF_WEEK = DAYS_OF_WEEK;

  return Doctor;
};
