"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "urgent_blood_requests",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          blood_groups: { type: Sequelize.JSON, allowNull: false },
          message: { type: Sequelize.TEXT, allowNull: false },
          contact_number: { type: Sequelize.STRING(30), allowNull: false },
          is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          created_by: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
          },
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

      await queryInterface.addIndex("urgent_blood_requests", ["is_active"], {
        transaction,
        name: "urgent_blood_requests_is_active_idx",
      });
      await queryInterface.addIndex("urgent_blood_requests", ["created_at"], {
        transaction,
        name: "urgent_blood_requests_created_at_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("urgent_blood_requests");
  },
};
