"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "fraud_reports",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          issue: { type: Sequelize.STRING(500), allowNull: false },
          date_of_incident: { type: Sequelize.STRING(100), allowNull: true },
          location: { type: Sequelize.STRING(255), allowNull: true },
          details: { type: Sequelize.TEXT, allowNull: false },
          status: {
            type: Sequelize.ENUM("pending", "reviewed", "dismissed"),
            allowNull: false,
            defaultValue: "pending",
          },
          investigation_notes: { type: Sequelize.TEXT, allowNull: true },
          reviewed_by: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
          },
          reviewed_by_name: { type: Sequelize.STRING(150), allowNull: true },
          reviewed_at: { type: Sequelize.DATE, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          transaction,
          charset: "utf8mb4",
          collate: "utf8mb4_unicode_ci",
          engine: "InnoDB",
        },
      );

      await queryInterface.addIndex("fraud_reports", ["status"], {
        transaction,
        name: "fraud_reports_status_idx",
      });
      await queryInterface.addIndex("fraud_reports", ["created_at"], {
        transaction,
        name: "fraud_reports_created_at_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("fraud_reports");
  },
};
