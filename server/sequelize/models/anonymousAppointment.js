"use strict";

// This model deliberately uses snake_case attribute names (case_code,
// case_type, contact_method, etc.) instead of the codebase's usual
// camelCase — because the existing Mongoose schema and the anonymous
// controller both use snake_case throughout the API contract (req.body
// fields and response payload keys). Preserving those names here keeps
// the cutover a pure model swap: no controller edits, no client-side
// changes. See controllers/anonymousController.js.

const CASE_TYPES = ["GBV", "Mental Health"];
const CONTACT_METHODS = ["phone", "in_person"];
const CASE_STATUSES = ["pending", "approved", "in_progress", "completed", "cancelled"];

module.exports = (sequelize, DataTypes) => {
  const AnonymousAppointment = sequelize.define(
    "AnonymousAppointment",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      case_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      case_type: {
        type: DataTypes.ENUM(...CASE_TYPES),
        allowNull: false,
      },
      contact_method: {
        type: DataTypes.ENUM(...CONTACT_METHODS),
        allowNull: false,
      },
      // Phone number when contact_method === "phone"; null for in_person.
      contact_value: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
      },
      safe_to_contact: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      preferred_date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      // Free-form time string (e.g. "10:00 AM", "3:30 PM") — matches
      // the existing controller/API. Not a real TIME column.
      preferred_time: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: null,
      },
      asap: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.ENUM(...CASE_STATUSES),
        allowNull: false,
        defaultValue: "pending",
      },
      // The Mongoose schema declared its own `created_at` field and
      // OMITTED the timestamps option — i.e. no updatedAt was ever
      // tracked. Preserved here (`timestamps: false`) so the DB row
      // shape stays a 1:1 match with the current model.
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "anonymous_appointments",
      timestamps: false,
      indexes: [
        { unique: true, fields: ["case_code"] },
        { fields: ["case_type"] },
        { fields: ["status"] },
        { fields: ["created_at"] },
      ],
    },
  );

  AnonymousAppointment.CASE_TYPES = CASE_TYPES;
  AnonymousAppointment.CONTACT_METHODS = CONTACT_METHODS;
  AnonymousAppointment.STATUSES = CASE_STATUSES;

  return AnonymousAppointment;
};
