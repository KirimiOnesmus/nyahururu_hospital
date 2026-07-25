"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "token_blacklist",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          jti: { type: Sequelize.STRING(255), allowNull: false, unique: true },
          expires_at: { type: Sequelize.DATE, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          transaction,
          charset: "utf8mb4",
          collate: "utf8mb4_unicode_ci",
          engine: "InnoDB",
        },
      );

      await queryInterface.addIndex("token_blacklist", ["expires_at"], {
        transaction,
        name: "token_blacklist_expires_at_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("token_blacklist");
  },
};
