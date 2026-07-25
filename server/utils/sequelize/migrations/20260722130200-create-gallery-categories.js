"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "gallery_categories",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
          description: { type: Sequelize.STRING(500), allowNull: true },
          icon: { type: Sequelize.STRING(100), allowNull: true },
          order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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

      await queryInterface.addIndex("gallery_categories", ["active"], {
        transaction,
        name: "gallery_categories_active_idx",
      });
      await queryInterface.addIndex("gallery_categories", ["order"], {
        transaction,
        name: "gallery_categories_order_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("gallery_categories");
  },
};
