"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Public registration no longer collects identity-document or health
    // screening fields. Keep the columns for existing records and allow new
    // registrations to leave them unset for in-person follow-up where needed.
    const optionalColumns = [
      ["national_id", Sequelize.STRING(30)],
      ["gender", Sequelize.ENUM("Male", "Female", "Other")],
      ["age", Sequelize.INTEGER.UNSIGNED],
      ["weight", Sequelize.FLOAT],
      ["health_conditions", Sequelize.TEXT],
      ["medications", Sequelize.TEXT],
    ];
    for (const [column, type] of optionalColumns) {
      const definition = { type, allowNull: true };
      if (["health_conditions", "medications"].includes(column)) definition.defaultValue = null;
      await queryInterface.changeColumn("blood_donors", column, definition);
    }

    await queryInterface.addColumn("blood_donors", "consent_privacy", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("blood_donors", "consent_privacy_version", {
      type: Sequelize.STRING(30),
      allowNull: true,
    });
    for (const column of ["consent_privacy_at", "consent_donate_at", "consent_test_at", "consent_terms_at"]) {
      await queryInterface.addColumn("blood_donors", column, {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    for (const column of ["consent_privacy_at", "consent_donate_at", "consent_test_at", "consent_terms_at", "consent_privacy_version", "consent_privacy"]) {
      await queryInterface.removeColumn("blood_donors", column);
    }
    // Keep the screening and ID columns nullable on rollback. Requiring data
    // that new public registrations intentionally do not collect would make
    // rollback fail or force fabricated placeholder values.
  },
};
