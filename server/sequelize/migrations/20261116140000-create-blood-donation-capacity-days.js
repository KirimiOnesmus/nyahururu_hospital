"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("blood_donation_capacity_days", {
      donation_date: {
        type: Sequelize.DATEONLY,
        primaryKey: true,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("blood_donation_capacity_days");
  },
};
