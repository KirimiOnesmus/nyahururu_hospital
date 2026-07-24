"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "users",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          first_name: { type: Sequelize.STRING(50), allowNull: false },
          last_name: { type: Sequelize.STRING(50), allowNull: false },
          name: { type: Sequelize.STRING(120), allowNull: true },
          email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
          password: { type: Sequelize.STRING(255), allowNull: false },
          email_verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          email_verification_token: { type: Sequelize.STRING(255), allowNull: true },
          email_verification_expire: { type: Sequelize.DATE, allowNull: true },
          password_reset_token: { type: Sequelize.STRING(255), allowNull: true },
          password_reset_expire: { type: Sequelize.DATE, allowNull: true },
          role: {
            type: Sequelize.ENUM(
              "superadmin",
              "admin",
              "doctor",
              "staff",
              "it",
              "nurse",
              "pharmacist",
              "communication",
              "research",
            ),
            allowNull: false,
            defaultValue: "staff",
          },
          department: { type: Sequelize.STRING(100), allowNull: true },
          position: { type: Sequelize.STRING(100), allowNull: true },
          phone: { type: Sequelize.STRING(30), allowNull: true },
          blood_group: { type: Sequelize.STRING(10), allowNull: true },
          expiry_date: { type: Sequelize.DATE, allowNull: true },
          signature_text: { type: Sequelize.STRING(255), allowNull: true },
          date_of_birth: { type: Sequelize.DATEONLY, allowNull: true },
          join_date: { type: Sequelize.DATEONLY, allowNull: true },
          photo: { type: Sequelize.STRING(500), allowNull: true },
          terms: { type: Sequelize.STRING(255), allowNull: true },
          signature: { type: Sequelize.STRING(500), allowNull: true },
          employee_id: { type: Sequelize.STRING(50), allowNull: true, unique: true },
          rfid_tag: { type: Sequelize.STRING(100), allowNull: true, unique: true },
          failed_login_attempts: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
          },
          lock_until: { type: Sequelize.DATE, allowNull: true },
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

      await queryInterface.addIndex("users", ["role"], { transaction, name: "users_role_idx" });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
