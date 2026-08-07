"use strict";

/**
 * 1:1 detail table for continuing-review (SERU Type B) submissions.
 * One row per submission (submission_type = 'continuing_review'), holding the
 * progress report and the mandatory supporting documents. Deleting the
 * submission cascades to its detail row.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("continuing_review_details", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      submission_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "submissions", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      progress_summary: { type: Sequelize.TEXT, allowNull: false },
      participants_enrolled: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      participants_continuing: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      adverse_events: { type: Sequelize.TEXT, allowNull: true },
      amendments: { type: Sequelize.TEXT, allowNull: true },
      constraints: { type: Sequelize.TEXT, allowNull: true },
      plans_for_next_year: { type: Sequelize.TEXT, allowNull: true },
      is_last_year: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      documents: { type: Sequelize.JSON, allowNull: false },
      submitted_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("continuing_review_details", ["submission_id"], {
      unique: true,
      name: "continuing_review_details_submission_id_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("continuing_review_details");
  },
};
