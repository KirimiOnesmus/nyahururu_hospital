"use strict";

/**
 * `authController.js` and `userController.js` both read/write
 * `user.mustChangePassword` (forces a password change after the
 * system-generated temp password on account creation / email
 * verification) and `user.isActive` (account deactivation, checked on
 * every login and by `verifyToken`/`refresh`).
 *
 * Neither column ever existed on the Mongoose schema (`models/userModel.js`)
 * — same silent-drop-under-strict-mode bug already identified and fixed
 * for `failedLoginAttempts`/`lockUntil` in the original cutover
 * (see MIGRATION_PLAN.md), just missed for these two. Adding them for
 * real here, following the same pattern, before the auth controllers are
 * cut over to Sequelize — otherwise "must change password on first
 * login" and "deactivate this account" silently stop working the moment
 * Mongo's schemaless writes are gone.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "users",
        "must_change_password",
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        "users",
        "is_active",
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        { transaction },
      );

      await queryInterface.addIndex("users", ["is_active"], {
        transaction,
        name: "users_is_active_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("users", "users_is_active_idx");
    await queryInterface.removeColumn("users", "is_active");
    await queryInterface.removeColumn("users", "must_change_password");
  },
};
