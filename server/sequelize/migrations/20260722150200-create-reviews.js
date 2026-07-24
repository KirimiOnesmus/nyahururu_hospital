"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Reviews has a partial-unique-index requirement (committee votes:
    // one vote per member per round of a stage of a research) that
    // MySQL can't express natively. We add a STORED generated column
    // that only takes a non-NULL value for committee-role rows, then
    // put a UNIQUE index over it. Multiple NULLs are allowed on unique
    // indexes, so reviewer-role rows never collide.
    //
    // MySQL 5.7.6+ / MariaDB 10.2+ support stored generated columns.
    // XAMPP's default MariaDB satisfies this; if you're on an older
    // MySQL, the second query below will error and this migration is a
    // reliable place to catch that at deploy time.
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "reviews",
        {
          id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
          research_id: {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
            references: { model: "researches", key: "id" },
            onDelete: "CASCADE", onUpdate: "CASCADE",
          },
          reviewer_id: {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
            references: { model: "researchers", key: "id" },
            onDelete: "RESTRICT", onUpdate: "CASCADE",
          },
          stage: {
            type: Sequelize.ENUM("proposal", "progress", "final_paper"),
            allowNull: false,
          },
          round: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
          decision: {
            type: Sequelize.ENUM("approved", "revision", "rejected", "suspended", "noted"),
            allowNull: false,
          },
          comment: { type: Sequelize.TEXT, allowNull: false },
          criteria: { type: Sequelize.JSON, allowNull: false },
          reviewer_role: {
            type: Sequelize.ENUM("reviewer", "committee"),
            allowNull: false,
          },
          is_latest: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          submitted_at: {
            type: Sequelize.DATE, allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          // Placeholder — replaced immediately below with a generated
          // column definition. queryInterface.createTable can't emit a
          // GENERATED ALWAYS AS clause directly, so we alter the column
          // in the same transaction.
          committee_vote_key: { type: Sequelize.STRING(120), allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction, charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" },
      );

      // Promote committee_vote_key to a stored generated column. The
      // expression yields non-NULL only for committee rows, giving the
      // desired "unique for committee, freely repeatable for reviewer"
      // semantics via the UNIQUE index below.
      await queryInterface.sequelize.query(
        `ALTER TABLE reviews
         MODIFY COLUMN committee_vote_key VARCHAR(120)
         GENERATED ALWAYS AS (
           CASE
             WHEN reviewer_role = 'committee'
             THEN CONCAT_WS('|', research_id, stage, round, reviewer_id)
             ELSE NULL
           END
         ) STORED`,
        { transaction },
      );

      const idx = (fields, name, opts = {}) =>
        queryInterface.addIndex("reviews", fields, { transaction, name, ...opts });

      await idx(["research_id", "stage", "is_latest"], "reviews_research_stage_latest_idx");
      await idx(["reviewer_id", "submitted_at"], "reviews_reviewer_submitted_idx");
      await idx(["research_id", "round"], "reviews_research_round_idx");
      await idx(
        ["research_id", "stage", "reviewer_role", "round"],
        "reviews_research_stage_role_round_idx",
      );
      await idx(["committee_vote_key"], "reviews_committee_vote_unique", { unique: true });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("reviews");
  },
};
