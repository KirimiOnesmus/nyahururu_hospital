"use strict";

const tableExists = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  return tables.some((table) => (typeof table === "string" ? table : table.tableName || table.name) === tableName);
};

const columnExists = async (queryInterface, tableName, columnName) => {
  const columns = await queryInterface.describeTable(tableName);
  return Object.prototype.hasOwnProperty.call(columns, columnName);
};

const ensureIndex = async (queryInterface, tableName, fields, name) => {
  const indexes = await queryInterface.showIndex(tableName);
  const exists = indexes.some((index) => {
    const indexedFields = (index.fields || []).map((field) => field.attribute || field.name || field);
    return indexedFields.length === fields.length && fields.every((field, i) => indexedFields[i] === field);
  });
  if (!exists) await queryInterface.addIndex(tableName, fields, { name });
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    if (!await columnExists(queryInterface, "blood_donors", "blood_group_source")) {
      await queryInterface.addColumn("blood_donors", "blood_group_source", {
        type: Sequelize.ENUM("self_reported", "office_verified", "unknown"), allowNull: false, defaultValue: "unknown",
      });
    }
    if (!await columnExists(queryInterface, "blood_donors", "blood_group_verified_by")) {
      await queryInterface.addColumn("blood_donors", "blood_group_verified_by", { type: Sequelize.BIGINT.UNSIGNED, allowNull: true });
    }
    if (!await columnExists(queryInterface, "blood_donors", "blood_group_verified_at")) {
      await queryInterface.addColumn("blood_donors", "blood_group_verified_at", { type: Sequelize.DATE, allowNull: true });
    }
    if (!await tableExists(queryInterface, "blood_donation_appointments")) {
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
    }
    await ensureIndex(queryInterface, "blood_donation_appointments", ["donor_id"], "bda_donor_idx");
    await ensureIndex(queryInterface, "blood_donation_appointments", ["donation_date", "status", "registration_status"], "bda_date_status_reg_idx");
    if (!await tableExists(queryInterface, "blood_donation_events")) {
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
    }
    const [donorIdColumn] = await sequelize.query(`
      SELECT CHARACTER_SET_NAME AS characterSet, COLLATION_NAME AS collationName
      FROM information_schema.COLUMNS
      WHERE BINARY TABLE_SCHEMA = BINARY DATABASE()
        AND BINARY TABLE_NAME = BINARY 'blood_donors'
        AND BINARY COLUMN_NAME = BINARY 'donor_id'
      LIMIT 1
    `);
    const donorIdCharacterSet = donorIdColumn[0]?.characterSet;
    const donorIdCollation = donorIdColumn[0]?.collationName;
    if (!/^utf8mb4$/.test(donorIdCharacterSet || "") || !/^utf8mb4_[a-zA-Z0-9_]+$/.test(donorIdCollation || "")) {
      throw new Error("Could not determine the donor_id charset and collation for blood donation tables.");
    }
    // Match the source donor key so MySQL comparisons and Sequelize joins do
    // not mix the database default collation with the existing table collation.
    for (const tableName of ["blood_donation_appointments", "blood_donation_events"]) {
      await sequelize.query(
        `ALTER TABLE \`${tableName}\` MODIFY \`donor_id\` VARCHAR(50) CHARACTER SET ${donorIdCharacterSet} COLLATE ${donorIdCollation} NOT NULL`,
      );
    }
    await ensureIndex(queryInterface, "blood_donation_events", ["donor_id", "donation_date"], "bde_donor_date_idx");
    // Preserve existing schedule data. Historic completed records are marked
    // unverified because their original verifier was not stored.
    await sequelize.query(`
      INSERT INTO blood_donation_appointments
        (donor_id, donation_date, donation_time, status, registration_status, created_at, updated_at)
      SELECT d.donor_id, d.donation_date, d.donation_time, d.status, d.registration_status, d.created_at, d.updated_at
      FROM blood_donors d
      WHERE NOT EXISTS (
        SELECT 1 FROM blood_donation_appointments a
        WHERE BINARY a.donor_id = BINARY d.donor_id AND a.donation_date = d.donation_date
          AND BINARY a.donation_time = BINARY d.donation_time
          AND BINARY a.status = BINARY d.status
          AND BINARY a.registration_status = BINARY d.registration_status
      )
    `);
    await sequelize.query(`UPDATE blood_donors SET blood_group_source = IF(BINARY blood_group = BINARY '', 'unknown', 'self_reported') WHERE BINARY blood_group_source = BINARY 'unknown'`);
    await sequelize.query(`
      INSERT INTO blood_donation_events
        (donor_id, appointment_id, donation_date, status, verification_status, verified_by, verified_at, created_at, updated_at)
      SELECT d.donor_id, a.id, d.donation_date, 'completed', 'legacy_unverified', NULL, NULL, d.created_at, d.updated_at
      FROM blood_donors d JOIN blood_donation_appointments a ON BINARY a.donor_id = BINARY d.donor_id
      WHERE BINARY d.status = BINARY 'completed' AND NOT EXISTS (
        SELECT 1 FROM blood_donation_events e WHERE e.appointment_id = a.id
      )
    `);
    // Appointment scheduling and workflow now live only on appointment rows.
    for (const column of ["donation_date", "donation_time", "status", "registration_status"]) {
      if (await columnExists(queryInterface, "blood_donors", column)) {
        await queryInterface.removeColumn("blood_donors", column);
      }
    }
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
