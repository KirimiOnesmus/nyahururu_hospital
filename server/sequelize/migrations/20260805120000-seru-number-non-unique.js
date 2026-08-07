"use strict";

/**
 * A SERU number identifies a study, not a single submission. Continuing
 * reviews, amendments, and closures are child rows that intentionally
 * share their parent study's SERU number, so `seru_number` must NOT be
 * UNIQUE. This drops the unique index (if present) and replaces it with a
 * plain lookup index.
 */
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT INDEX_NAME, NON_UNIQUE
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'researches'
          AND COLUMN_NAME = 'seru_number'`,
    );

    const uniqueIdx = rows.find((r) => Number(r.NON_UNIQUE) === 0);
    if (uniqueIdx) {
      await queryInterface.sequelize.query(
        `ALTER TABLE \`researches\` DROP INDEX \`${uniqueIdx.INDEX_NAME}\``,
      );
    }

    const hasPlain = rows.some(
      (r) => r.INDEX_NAME === "researches_seru_number_idx",
    );
    if (!hasPlain) {
      await queryInterface.addIndex("researches", ["seru_number"], {
        name: "researches_seru_number_idx",
      });
    }
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT INDEX_NAME
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'researches'
          AND INDEX_NAME = 'researches_seru_number_idx'`,
    );
    if (rows.length) {
      await queryInterface.removeIndex("researches", "researches_seru_number_idx");
    }
  },
};
