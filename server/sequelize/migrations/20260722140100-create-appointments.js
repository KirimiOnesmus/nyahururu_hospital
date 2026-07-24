"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "appointments",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          patient_name: { type: Sequelize.STRING(150), allowNull: false },
          patient_email: { type: Sequelize.STRING(255), allowNull: false },
          phone: { type: Sequelize.STRING(30), allowNull: false },
          department: { type: Sequelize.STRING(100), allowNull: false },
          service: { type: Sequelize.STRING(150), allowNull: false },
          appointment_date: { type: Sequelize.STRING(30), allowNull: false },
          time: { type: Sequelize.STRING(20), allowNull: false },
          status: {
            type: Sequelize.ENUM("Pending", "Confirmed", "Cancelled", "Completed"),
            allowNull: false,
            defaultValue: "Pending",
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

      await queryInterface.addIndex("appointments", ["patient_email"], {
        transaction,
        name: "appointments_patient_email_idx",
      });
      await queryInterface.addIndex("appointments", ["status"], {
        transaction,
        name: "appointments_status_idx",
      });
      await queryInterface.addIndex("appointments", ["appointment_date"], {
        transaction,
        name: "appointments_appointment_date_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("appointments");
  },
};
