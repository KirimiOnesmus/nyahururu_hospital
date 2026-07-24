"use strict";

const APPOINTMENT_STATUSES = ["Pending", "Confirmed", "Cancelled", "Completed"];

module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define(
    "Appointment",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      patientName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      patientEmail: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { isEmail: true },
        set(value) {
          this.setDataValue("patientEmail", value ? value.trim().toLowerCase() : value);
        },
      },
      phone: { type: DataTypes.STRING(30), allowNull: false },
      department: { type: DataTypes.STRING(100), allowNull: false },
      service: { type: DataTypes.STRING(150), allowNull: false },
      // The Mongoose model stores appointmentDate and time as free-form
      // strings (frontend sends e.g. "2026-08-15" / "14:30"). Kept as
      // strings here to avoid silently changing what the API accepts on
      // cutover. Tightening to a real DATE + TIME is a separate cleanup.
      appointmentDate: { type: DataTypes.STRING(30), allowNull: false },
      time: { type: DataTypes.STRING(20), allowNull: false },
      status: {
        type: DataTypes.ENUM(...APPOINTMENT_STATUSES),
        allowNull: false,
        defaultValue: "Pending",
      },
    },
    {
      tableName: "appointments",
      indexes: [
        { fields: ["patient_email"] },
        { fields: ["status"] },
        { fields: ["appointment_date"] },
      ],
    },
  );

  Appointment.STATUSES = APPOINTMENT_STATUSES;

  return Appointment;
};
