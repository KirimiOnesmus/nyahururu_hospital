"use strict";

const FRAUD_STATUSES = ["pending", "reviewed", "dismissed"];

module.exports = (sequelize, DataTypes) => {
  const FraudReport = sequelize.define(
    "FraudReport",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      issue: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: { notEmpty: true },
      },
      // Free-form string in the original schema — often "approx. last
      // Tuesday" style entries. Kept as string, not DATE, so the API
      // contract is unchanged.
      dateOfIncident: DataTypes.STRING(100),
      location: DataTypes.STRING(255),
      details: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
      status: {
        type: DataTypes.ENUM(...FRAUD_STATUSES),
        allowNull: false,
        defaultValue: "pending",
      },
      investigationNotes: DataTypes.TEXT,
      reviewedBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      // Denormalized name of the reviewer, kept because the original
      // schema stored it explicitly — useful when a reviewer account is
      // later deactivated and the user row is anonymised.
      reviewedByName: DataTypes.STRING(150),
      reviewedAt: DataTypes.DATE,
    },
    {
      tableName: "fraud_reports",
      indexes: [
        { fields: ["status"] },
        { fields: ["created_at"] },
      ],
    },
  );

  FraudReport.associate = (models) => {
    FraudReport.belongsTo(models.User, { foreignKey: "reviewedBy", as: "reviewer" });
  };

  FraudReport.STATUSES = FRAUD_STATUSES;

  return FraudReport;
};
