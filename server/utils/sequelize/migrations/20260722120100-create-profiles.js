"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "profiles",
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
          phone: { type: Sequelize.STRING(30), allowNull: true },
          address: { type: Sequelize.STRING(255), allowNull: true },
          image_url: { type: Sequelize.STRING(500), allowNull: true, defaultValue: null },
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
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("profiles");
  },
};
