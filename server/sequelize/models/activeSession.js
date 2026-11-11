"use strict";

module.exports = (sequelize, DataTypes) => sequelize.define("ActiveSession", {
  sessionId: { type: DataTypes.STRING(64), primaryKey: true, allowNull: false },
  accountId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  collection: { type: DataTypes.ENUM("users", "researchers"), allowNull: false },
  lastActiveAt: { type: DataTypes.DATE(3), allowNull: false },
  revokedAt: { type: DataTypes.DATE, allowNull: true },
  revocationReason: { type: DataTypes.STRING(80), allowNull: true },
}, {
  tableName: "active_sessions",
  indexes: [
    { fields: ["collection", "account_id", "revoked_at"], name: "active_sessions_account_status" },
    { fields: ["last_active_at"], name: "active_sessions_last_active" },
  ],
});
