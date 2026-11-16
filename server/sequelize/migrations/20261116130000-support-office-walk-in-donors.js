"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("blood_donors", "email", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn("blood_donors", "registration_source", {
      type: Sequelize.ENUM("public", "office"),
      allowNull: false,
      defaultValue: "public",
    });
  },

  async down(queryInterface, Sequelize) {
    const [[{ count }]] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS count FROM blood_donors WHERE email IS NULL",
    );
    if (Number(count) > 0) {
      throw new Error("Cannot require donor email while walk-in records without email addresses exist.");
    }

    await queryInterface.removeColumn("blood_donors", "registration_source");
    await queryInterface.changeColumn("blood_donors", "email", {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  },
};
