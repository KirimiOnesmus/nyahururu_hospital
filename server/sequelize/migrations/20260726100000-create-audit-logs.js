"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("audit_logs", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      user_name: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      user_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      user_role: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      resource: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      resource_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      severity: {
        type: Sequelize.ENUM("info", "low", "medium", "high", "critical"),
        allowNull: false,
        defaultValue: "info",
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      session_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      changes: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("audit_logs", ["user_id"]);
    await queryInterface.addIndex("audit_logs", ["action"]);
    await queryInterface.addIndex("audit_logs", ["resource"]);
    await queryInterface.addIndex("audit_logs", ["severity"]);
    await queryInterface.addIndex("audit_logs", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("audit_logs");
  },
};
