"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("counters", {
      key: {
        type: Sequelize.STRING(100),
        primaryKey: true,
      },
      seq: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
    }, {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
      engine: "InnoDB",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("counters");
  },
};
