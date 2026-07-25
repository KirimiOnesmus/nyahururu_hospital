"use strict";

/**
 * Closes the three circular references on researches:
 *
 *   researches.submission_payment_id     ──▶ payments(id)
 *   researches.clearance_certificate_id  ──▶ certificates(id)
 *   researches.completion_certificate_id ──▶ certificates(id)
 *
 * Each of these columns exists as of migration 20260722150000, but the
 * FK constraints must wait until the target tables exist. Since
 * payments and certificates both FK to researches, defining these
 * upfront in the researches migration would deadlock the creation order.
 *
 * ON DELETE SET NULL because deleting a payment or certificate should
 * not cascade-delete the parent research row — the research remains an
 * institutional record even after related artifacts are removed.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addConstraint("researches", {
        fields: ["submission_payment_id"],
        type: "foreign key",
        name: "researches_submission_payment_fk",
        references: { table: "payments", field: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        transaction,
      });
      await queryInterface.addConstraint("researches", {
        fields: ["clearance_certificate_id"],
        type: "foreign key",
        name: "researches_clearance_certificate_fk",
        references: { table: "certificates", field: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        transaction,
      });
      await queryInterface.addConstraint("researches", {
        fields: ["completion_certificate_id"],
        type: "foreign key",
        name: "researches_completion_certificate_fk",
        references: { table: "certificates", field: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint("researches", "researches_submission_payment_fk", { transaction });
      await queryInterface.removeConstraint("researches", "researches_clearance_certificate_fk", { transaction });
      await queryInterface.removeConstraint("researches", "researches_completion_certificate_fk", { transaction });
    });
  },
};
