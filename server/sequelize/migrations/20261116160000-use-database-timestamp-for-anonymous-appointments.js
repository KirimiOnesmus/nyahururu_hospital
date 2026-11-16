"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("anonymous_appointments", "created_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("anonymous_appointments", "created_at", {
      type: Sequelize.DATE,
      allowNull: false,
    });
  },
};
