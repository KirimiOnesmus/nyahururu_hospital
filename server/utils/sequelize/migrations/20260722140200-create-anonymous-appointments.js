"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "anonymous_appointments",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          case_code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
          case_type: {
            type: Sequelize.ENUM("GBV", "Mental Health"),
            allowNull: false,
          },
          contact_method: {
            type: Sequelize.ENUM("phone", "in_person"),
            allowNull: false,
          },
          contact_value: { type: Sequelize.STRING(50), allowNull: true, defaultValue: null },
          safe_to_contact: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          preferred_date: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
          preferred_time: { type: Sequelize.STRING(20), allowNull: true, defaultValue: null },
          asap: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          reason: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
          status: {
            type: Sequelize.ENUM("pending", "approved", "in_progress", "completed", "cancelled"),
            allowNull: false,
            defaultValue: "pending",
          },
          // Note: no updated_at — the original Mongoose schema opted OUT
          // of timestamps and manually managed created_at only.
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        {
          transaction,
          charset: "utf8mb4",
          collate: "utf8mb4_unicode_ci",
          engine: "InnoDB",
        },
      );

      await queryInterface.addIndex("anonymous_appointments", ["case_type"], {
        transaction,
        name: "anonymous_appointments_case_type_idx",
      });
      await queryInterface.addIndex("anonymous_appointments", ["status"], {
        transaction,
        name: "anonymous_appointments_status_idx",
      });
      await queryInterface.addIndex("anonymous_appointments", ["created_at"], {
        transaction,
        name: "anonymous_appointments_created_at_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("anonymous_appointments");
  },
};
