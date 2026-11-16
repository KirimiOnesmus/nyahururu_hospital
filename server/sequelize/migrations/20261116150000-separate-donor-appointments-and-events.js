"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    await queryInterface.addColumn("blood_donors", "blood_group_source", {
      type: Sequelize.ENUM("self_reported", "office_verified", "unknown"), allowNull: false, defaultValue: "unknown",
    });
    await queryInterface.addColumn("blood_donors", "blood_group_verified_by", { type: Sequelize.BIGINT.UNSIGNED, allowNull: true });
    await queryInterface.addColumn("blood_donors", "blood_group_verified_at", { type: Sequelize.DATE, allowNull: true });
    await queryInterface.createTable("blood_donation_appointments", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      donor_id: { type: Sequelize.STRING(50), allowNull: false },
      donation_date: { type: Sequelize.DATEONLY, allowNull: false },
      donation_time: { type: Sequelize.STRING(20), allowNull: false },
      status: { type: Sequelize.ENUM("registered", "confirmed", "completed", "cancelled", "deferred"), allowNull: false, defaultValue: "registered" },
      registration_status: { type: Sequelize.ENUM("pending", "approved", "rejected"), allowNull: false, defaultValue: "pending" },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("blood_donation_appointments", ["donor_id"]);
    await queryInterface.addIndex("blood_donation_appointments", ["donation_date", "status", "registration_status"]);
    await queryInterface.createTable("blood_donation_events", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      donor_id: { type: Sequelize.STRING(50), allowNull: false },
      appointment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true, unique: true },
      donation_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.ENUM("completed", "deferred"), allowNull: false, defaultValue: "completed" },
      verification_status: { type: Sequelize.ENUM("verified", "legacy_unverified"), allowNull: false, defaultValue: "verified" },
      verified_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      verified_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("blood_donation_events", ["donor_id", "donation_date"]);
    // Preserve existing schedule data. Historic completed records are marked
    // unverified because their original verifier was not stored.
    await sequelize.query(`
      INSERT INTO blood_donation_appointments
        (donor_id, donation_date, donation_time, status, registration_status, created_at, updated_at)
      SELECT donor_id, donation_date, donation_time, status, registration_status, created_at, updated_at
      FROM blood_donors
    `);
    await sequelize.query(`UPDATE blood_donors SET blood_group_source = IF(blood_group = '', 'unknown', 'self_reported')`);
    await sequelize.query(`
      INSERT INTO blood_donation_events
        (donor_id, appointment_id, donation_date, status, verification_status, verified_by, verified_at, created_at, updated_at)
      SELECT d.donor_id, a.id, d.donation_date, 'completed', 'legacy_unverified', NULL, NULL, d.created_at, d.updated_at
      FROM blood_donors d JOIN blood_donation_appointments a ON a.donor_id = d.donor_id
      WHERE d.status = 'completed'
    `);
    // Appointment scheduling and workflow now live only on appointment rows.
    await queryInterface.removeColumn("blood_donors", "donation_date");
    await queryInterface.removeColumn("blood_donors", "donation_time");
    await queryInterface.removeColumn("blood_donors", "status");
    await queryInterface.removeColumn("blood_donors", "registration_status");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("blood_donors", "donation_date", { type: Sequelize.DATEONLY, allowNull: true });
    await queryInterface.addColumn("blood_donors", "donation_time", { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn("blood_donors", "status", {
      type: Sequelize.ENUM("registered", "confirmed", "completed", "cancelled", "deferred"), allowNull: false, defaultValue: "registered",
    });
    await queryInterface.addColumn("blood_donors", "registration_status", {
      type: Sequelize.ENUM("pending", "approved", "rejected"), allowNull: false, defaultValue: "pending",
    });
    await queryInterface.sequelize.query(`
      UPDATE blood_donors d
      JOIN (SELECT donor_id, MAX(id) AS appointment_id FROM blood_donation_appointments GROUP BY donor_id) last_appt
        ON last_appt.donor_id = d.donor_id
      JOIN blood_donation_appointments a ON a.id = last_appt.appointment_id
      SET d.donation_date = a.donation_date, d.donation_time = a.donation_time,
          d.status = a.status, d.registration_status = a.registration_status
    `);
    await queryInterface.dropTable("blood_donation_events");
    await queryInterface.dropTable("blood_donation_appointments");
    await queryInterface.changeColumn("blood_donors", "donation_date", {
      type: Sequelize.DATEONLY, allowNull: false,
    });
    await queryInterface.changeColumn("blood_donors", "donation_time", {
      type: Sequelize.STRING(20), allowNull: false,
    });
    await queryInterface.removeColumn("blood_donors", "blood_group_verified_at");
    await queryInterface.removeColumn("blood_donors", "blood_group_verified_by");
    await queryInterface.removeColumn("blood_donors", "blood_group_source");
  },
};
