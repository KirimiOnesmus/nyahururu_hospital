"use strict";

/**
 * 1:1 detail table for study-closure submissions. One row per submission
 * (submission_type = 'study_closure'), holding the closeout report, disposal
 * plans and publication link. Deleting the submission cascades here.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("closure_details", {
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
      closure_reason: {
        type: Sequelize.ENUM(
          "completed",
          "premature_discontinuation",
          "not_started",
          "transferred",
        ),
        allowNull: false,
      },
      results_summary: { type: Sequelize.TEXT, allowNull: true },
      publications: { type: Sequelize.TEXT, allowNull: true },
      participant_identifiers_destroyed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      specimen_disposal_plan: { type: Sequelize.TEXT, allowNull: true },
      data_future_use_plan: { type: Sequelize.TEXT, allowNull: true },
      investigational_product_disposal: { type: Sequelize.TEXT, allowNull: true },
      closeout_report_file: { type: Sequelize.STRING(500), allowNull: true },
      closeout_report_file_key: { type: Sequelize.STRING(255), allowNull: true },
      publication_link: { type: Sequelize.STRING(500), allowNull: true },
      submitted_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("closure_details", ["submission_id"], {
      unique: true,
      name: "closure_details_submission_id_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("closure_details");
    // ENUM type cleanup (MySQL inlines ENUM on the column, so dropping the
    // table is sufficient; no separate type to drop as in Postgres).
  },
};
