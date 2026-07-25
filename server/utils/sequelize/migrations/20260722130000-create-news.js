"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "news",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          content: { type: Sequelize.TEXT, allowNull: false },
          author: { type: Sequelize.STRING(150), allowNull: true },
          image_url: { type: Sequelize.STRING(500), allowNull: true },
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

      await queryInterface.addIndex("news", ["created_at"], {
        transaction,
        name: "news_created_at_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("news");
  },
};
