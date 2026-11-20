"use strict";

const generateConfirmationCode = require("../../utils/confirmationCode");

const tables = ["appointments", "ambulance_bookings"];

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const table of tables) {
      await queryInterface.addColumn(table, "confirmation_code", {
        type: Sequelize.STRING(13),
        allowNull: true,
      });

      const [rows] = await queryInterface.sequelize.query(
        `SELECT id FROM ${table} WHERE confirmation_code IS NULL`,
      );
      const assigned = new Set();
      for (const row of rows) {
        let code;
        do {
          code = generateConfirmationCode();
        } while (assigned.has(code));
        assigned.add(code);
        await queryInterface.bulkUpdate(
          table,
          { confirmation_code: code },
          { id: row.id },
        );
      }

      await queryInterface.changeColumn(table, "confirmation_code", {
        type: Sequelize.STRING(13),
        allowNull: false,
      });
      await queryInterface.addIndex(table, ["confirmation_code"], {
        unique: true,
        name: `${table}_confirmation_code_unique`,
      });
    }
  },

  async down(queryInterface) {
    for (const table of tables) {
      await queryInterface.removeIndex(table, `${table}_confirmation_code_unique`);
      await queryInterface.removeColumn(table, "confirmation_code");
    }
  },
};
