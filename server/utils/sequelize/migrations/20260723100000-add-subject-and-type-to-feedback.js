"use strict";

/**
 * Adds `subject` and `type` columns to feedback.
 *
 * feedbackController.js has always accepted and written these fields at
 * .create() time, but they never existed on the Mongoose Feedback schema
 * — so under Mongoose's default strict mode they were silently dropped
 * on save. Same latent bug the auth cutover caught for User.isActive /
 * mustChangePassword; fixing it as part of the Content-domain cutover
 * before any Sequelize code depends on the field being present.
 *
 * Both are non-empty STRINGs. `type` is required by the controller
 * (`if (!type) return 400`) but kept nullable at the DB layer so
 * existing pre-cutover rows (all of them, in this dev DB) don't need
 * backfill.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "feedback",
        "subject",
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        "feedback",
        "type",
        { type: Sequelize.STRING(50), allowNull: true },
        { transaction },
      );
      // Filter-by-type is used by getAllFeedback (?type=... query param),
      // so index it for the admin listing view.
      await queryInterface.addIndex("feedback", ["type"], {
        transaction,
        name: "feedback_type_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex("feedback", "feedback_type_idx", { transaction });
      await queryInterface.removeColumn("feedback", "type", { transaction });
      await queryInterface.removeColumn("feedback", "subject", { transaction });
    });
  },
};
