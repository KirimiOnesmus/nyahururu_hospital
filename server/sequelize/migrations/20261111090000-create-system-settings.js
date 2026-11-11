"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("system_settings", {
      key: { type: Sequelize.STRING(80), primaryKey: true, allowNull: false },
      value: { type: Sequelize.TEXT, allowNull: false },
      updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.bulkInsert("system_settings", [{
      key: "maintenance_mode", value: "false", updated_by: null,
      created_at: new Date(), updated_at: new Date(),
    }]);
  },
  async down(queryInterface) {
    await queryInterface.dropTable("system_settings");
  },
};
