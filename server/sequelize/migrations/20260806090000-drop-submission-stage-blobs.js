"use strict";

/**
 * Stage-specific payloads for continuing reviews and closures move out of the
 * base submissions table into dedicated 1:1 detail tables
 * (continuing_review_details, closure_details). This removes the sparse
 * NULL columns and JSON blobs from the base table.
 *
 * `continuing_review_number` stays — it is part of the submission's identity
 * (used to build the `<parent>-CR<n>` code), not stage detail.
 *
 * Runs before the researches -> submissions rename, so it targets
 * "researches". Safe to drop directly because the system has no production
 * data yet; `down` re-creates the columns for reversibility.
 */
const DROP_COLUMNS = [
  "continuing_review_data",
  "progress_data",
  "progress_files",
  "closure_report",
  "closure_reason",
  "closeout_report_file",
  "closeout_report_file_key",
  "publication_link",
];

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable("researches");
    for (const col of DROP_COLUMNS) {
      if (table[col]) {
        // eslint-disable-next-line no-await-in-loop
        await queryInterface.removeColumn("researches", col);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("researches");
    const add = async (name, spec) => {
      if (!table[name]) await queryInterface.addColumn("researches", name, spec);
    };
    await add("continuing_review_data", { type: Sequelize.JSON, allowNull: true });
    await add("progress_data", { type: Sequelize.JSON, allowNull: true });
    await add("progress_files", { type: Sequelize.JSON, allowNull: true });
    await add("closure_report", { type: Sequelize.JSON, allowNull: true });
    await add("closure_reason", {
      type: Sequelize.ENUM(
        "completed",
        "premature_discontinuation",
        "not_started",
        "transferred",
      ),
      allowNull: true,
    });
    await add("closeout_report_file", { type: Sequelize.STRING(500), allowNull: true });
    await add("closeout_report_file_key", { type: Sequelize.STRING(255), allowNull: true });
    await add("publication_link", { type: Sequelize.STRING(500), allowNull: true });
  },
};
