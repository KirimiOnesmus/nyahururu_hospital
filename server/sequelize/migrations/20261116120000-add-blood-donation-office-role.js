"use strict";

const USER_ROLES = [
  "superadmin",
  "admin",
  "doctor",
  "staff",
  "it",
  "nurse",
  "pharmacist",
  "communication",
  "research",
  "blood_donation",
];

const LEGACY_USER_ROLES = USER_ROLES.filter((role) => role !== "blood_donation");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM(...USER_ROLES),
      allowNull: false,
      defaultValue: "staff",
    });
  },

  async down(queryInterface, Sequelize) {
    const [[{ count }]] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'blood_donation'",
    );
    if (Number(count) > 0) {
      throw new Error("Cannot remove blood_donation while office accounts still exist; reassign or remove them first.");
    }

    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM(...LEGACY_USER_ROLES),
      allowNull: false,
      defaultValue: "staff",
    });
  },
};
