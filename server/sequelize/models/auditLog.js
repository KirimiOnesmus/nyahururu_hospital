"use strict";

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    "AuditLog",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      userName: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      userEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      userRole: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      resource: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      resourceId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      severity: {
        type: DataTypes.ENUM("info", "low", "medium", "high", "critical"),
        allowNull: false,
        defaultValue: "info",
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sessionId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      changes: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "audit_logs",
      indexes: [
        { fields: ["user_id"] },
        { fields: ["action"] },
        { fields: ["resource"] },
        { fields: ["severity"] },
        { fields: ["created_at"] },
      ],
    }
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: "SET NULL",
    });
  };

  return AuditLog;
};
