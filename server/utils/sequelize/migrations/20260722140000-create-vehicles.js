"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "vehicles",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          plate: { type: Sequelize.STRING(20), allowNull: false, unique: true },
          type: {
            type: Sequelize.ENUM("Ambulance", "Service Van", "Delivery Truck", "Staff Transport"),
            allowNull: false,
          },
          status: {
            type: Sequelize.ENUM("Available", "In Use", "Maintenance"),
            allowNull: false,
            defaultValue: "Available",
          },
          driver: { type: Sequelize.STRING(150), allowNull: true },
          last_service: { type: Sequelize.DATE, allowNull: true },
          next_service: { type: Sequelize.DATE, allowNull: true },
          mileage: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
          color: { type: Sequelize.STRING(50), allowNull: true },
          make: { type: Sequelize.STRING(80), allowNull: true },
          model: { type: Sequelize.STRING(80), allowNull: true },
          year: { type: Sequelize.INTEGER, allowNull: true },
          registration_expiry: { type: Sequelize.DATE, allowNull: true },
          insurance_expiry: { type: Sequelize.DATE, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          created_by: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
          },
          updated_by: {
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

      await queryInterface.addIndex("vehicles", ["status"], {
        transaction,
        name: "vehicles_status_idx",
      });
      await queryInterface.addIndex("vehicles", ["type"], {
        transaction,
        name: "vehicles_type_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("vehicles");
  },
};
