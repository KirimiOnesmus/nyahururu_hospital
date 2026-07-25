"use strict";

/**
 * Closes the circular reference between tenders and bids:
 *
 *   tenders ─(awarded_bid_id)─▶ bids
 *   bids    ─(tender_id)──────▶ tenders
 *
 * Both columns exist as of the earlier migrations, but the FK constraint
 * on tenders.awarded_bid_id has to wait until bids exists — otherwise
 * CREATE TABLE tenders (…, FOREIGN KEY(awarded_bid_id) REFERENCES bids…)
 * fails because bids hasn't been created yet.
 *
 * ON DELETE SET NULL because deleting a winning bid should un-award the
 * tender, not cascade-delete the whole tender record (an audited
 * procurement history is more important than referential purity).
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint("tenders", {
      fields: ["awarded_bid_id"],
      type: "foreign key",
      name: "tenders_awarded_bid_id_fk",
      references: { table: "bids", field: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint("tenders", "tenders_awarded_bid_id_fk");
  },
};
