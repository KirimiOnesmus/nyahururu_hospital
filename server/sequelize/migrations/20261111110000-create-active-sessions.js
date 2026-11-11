"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("active_sessions", {
      session_id: { type: Sequelize.STRING(64), primaryKey: true, allowNull: false },
      account_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      collection: { type: Sequelize.ENUM("users", "researchers"), allowNull: false },
      last_active_at: { type: Sequelize.DATE(3), allowNull: false },
      revoked_at: { type: Sequelize.DATE, allowNull: true },
      revocation_reason: { type: Sequelize.STRING(80), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("active_sessions", ["collection", "account_id", "revoked_at"], {
      name: "active_sessions_account_status",
    });
    await queryInterface.addIndex("active_sessions", ["last_active_at"], {
      name: "active_sessions_last_active",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("active_sessions");
  },
};
