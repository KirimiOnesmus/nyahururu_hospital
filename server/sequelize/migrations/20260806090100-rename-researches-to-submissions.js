"use strict";

/**
 * `researches` held every submission type (proposals, continuing reviews,
 * amendments, closures) discriminated by `submission_type`, so the honest
 * name for the table is `submissions`. MySQL updates the referenced table
 * name in all inbound foreign keys (reviews, payments, research_reviewers,
 * co_investigator_assignments, protocol_deviations, certificates,
 * research_decision_reports) automatically on RENAME TABLE, so no FK rework
 * is needed. FK *column* names (e.g. research_id) are left unchanged.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.renameTable("researches", "submissions");
  },

  async down(queryInterface) {
    await queryInterface.renameTable("submissions", "researches");
  },
};
