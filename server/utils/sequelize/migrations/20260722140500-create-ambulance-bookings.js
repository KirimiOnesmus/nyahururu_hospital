"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "ambulance_bookings",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          patient_name: { type: Sequelize.STRING(150), allowNull: false },
          phone: { type: Sequelize.STRING(30), allowNull: false },
          email: { type: Sequelize.STRING(255), allowNull: true },
          current_location: { type: Sequelize.STRING(500), allowNull: false },
          destination_hospital: {
            type: Sequelize.STRING(255),
            allowNull: false,
            defaultValue: "Not specified",
          },
          emergency_level: {
            type: Sequelize.ENUM("standard", "urgent", "critical"),
            allowNull: false,
            defaultValue: "standard",
          },
          medical_condition: { type: Sequelize.TEXT, allowNull: false },
          additional_notes: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM(
              "Pending",
              "Assigned",
              "In Transit",
              "Arrived",
              "Completed",
              "Cancelled",
              "Waiting",
            ),
            allowNull: false,
            defaultValue: "Pending",
          },
          vehicle_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            references: { model: "vehicles", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
          },
          user_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
          },
          booking_date: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          assigned_at: { type: Sequelize.DATE, allowNull: true },
          completed_at: { type: Sequelize.DATE, allowNull: true },
          cancelled_at: { type: Sequelize.DATE, allowNull: true },
          cancel_reason: { type: Sequelize.STRING(500), allowNull: true },
          estimated_arrival: { type: Sequelize.DATE, allowNull: true },
          actual_arrival: { type: Sequelize.DATE, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
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

      await queryInterface.addIndex("ambulance_bookings", ["status"], {
        transaction,
        name: "ambulance_bookings_status_idx",
      });
      await queryInterface.addIndex("ambulance_bookings", ["booking_date"], {
        transaction,
        name: "ambulance_bookings_booking_date_idx",
      });
      await queryInterface.addIndex("ambulance_bookings", ["emergency_level"], {
        transaction,
        name: "ambulance_bookings_emergency_level_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ambulance_bookings");
  },
};
