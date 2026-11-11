"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkUpdate("users", {
      email_verification_token: null,
      email_verification_expire: null,
      password_reset_token: null,
      password_reset_expire: null,
      email_verified: true,
    }, { role: "superadmin" });
  },

  async down() {
    // Secret values are intentionally cleared and cannot be restored.
  },
};
