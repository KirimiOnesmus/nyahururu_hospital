"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "blood_donors",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          donor_id: { type: Sequelize.STRING(50), allowNull: true, unique: true },
          full_name: { type: Sequelize.STRING(150), allowNull: false },
          email: { type: Sequelize.STRING(255), allowNull: false },
          phone: { type: Sequelize.STRING(30), allowNull: false },
          national_id: { type: Sequelize.STRING(30), allowNull: false, unique: true },
          gender: {
            type: Sequelize.ENUM("Male", "Female", "Other"),
            allowNull: false,
          },
          age: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
          weight: { type: Sequelize.FLOAT, allowNull: false },
          // Empty-string enum value preserved as a "not-yet-set" sentinel,
          // matching the original Mongoose schema.
          blood_group: {
            type: Sequelize.ENUM("O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", ""),
            allowNull: false,
            defaultValue: "",
          },
          health_conditions: { type: Sequelize.TEXT, allowNull: false },
          medications: { type: Sequelize.TEXT, allowNull: false },
          donation_date: { type: Sequelize.DATEONLY, allowNull: false },
          donation_time: { type: Sequelize.STRING(20), allowNull: false },
          consent_donate: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          consent_test: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          consent_terms: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          status: {
            type: Sequelize.ENUM(
              "registered",
              "confirmed",
              "completed",
              "cancelled",
              "deferred",
            ),
            allowNull: false,
            defaultValue: "registered",
          },
          registration_status: {
            type: Sequelize.ENUM("pending", "approved", "rejected"),
            allowNull: false,
            defaultValue: "pending",
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

      await queryInterface.addIndex("blood_donors", ["email"], {
        transaction,
        name: "blood_donors_email_idx",
      });
      await queryInterface.addIndex("blood_donors", ["donation_date"], {
        transaction,
        name: "blood_donors_donation_date_idx",
      });
      await queryInterface.addIndex("blood_donors", ["status"], {
        transaction,
        name: "blood_donors_status_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("blood_donors");
  },
};
