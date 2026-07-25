"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "doctors",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          user_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            unique: true,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          speciality: { type: Sequelize.STRING(150), allowNull: true },
          department: { type: Sequelize.STRING(150), allowNull: true },
          bio: { type: Sequelize.STRING(1000), allowNull: true },
          education: { type: Sequelize.STRING(500), allowNull: true },
          availability: { type: Sequelize.JSON, allowNull: false },
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

      await queryInterface.addIndex("doctors", ["speciality"], {
        transaction,
        name: "doctors_speciality_idx",
      });
      await queryInterface.addIndex("doctors", ["department"], {
        transaction,
        name: "doctors_department_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("doctors");
  },
};
