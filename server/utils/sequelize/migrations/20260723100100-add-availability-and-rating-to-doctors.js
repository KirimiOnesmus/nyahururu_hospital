"use strict";

/**
 * Adds `is_available_now` (boolean) and `rating` (decimal) to doctors.
 *
 * doctorController.js reads/writes `doctor.isAvailableNow` and orders
 * getAllDoctors by `rating DESC`. Neither field was ever declared on
 * the Mongoose Doctor schema — same silent-drop-under-strict-mode bug
 * as User.mustChangePassword / User.isActive (see the 090000 migration)
 * and Feedback.subject/type (see 100000). Landing them as real, indexed
 * columns before any Sequelize code depends on them.
 *
 * DECIMAL(2,1) covers 0.0 through 9.9 with a single decimal place —
 * standard 0-5 star rating shape with headroom, exact arithmetic on
 * updates.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "doctors",
        "is_available_now",
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );
      await queryInterface.addColumn(
        "doctors",
        "rating",
        { type: Sequelize.DECIMAL(2, 1), allowNull: false, defaultValue: 0 },
        { transaction },
      );

      // getAllDoctors filters by is_available_now and orders by rating
      // — both benefit from an index. Compound so the "available doctors
      // sorted by rating" query hits it cleanly.
      await queryInterface.addIndex("doctors", ["is_available_now", "rating"], {
        transaction,
        name: "doctors_available_rating_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex("doctors", "doctors_available_rating_idx", { transaction });
      await queryInterface.removeColumn("doctors", "rating", { transaction });
      await queryInterface.removeColumn("doctors", "is_available_now", { transaction });
    });
  },
};
