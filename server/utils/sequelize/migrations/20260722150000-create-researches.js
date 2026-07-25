"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "researches",
        {
          id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
          researcher_id: {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
            references: { model: "researchers", key: "id" },
            onDelete: "RESTRICT", onUpdate: "CASCADE",
          },
          research_id: { type: Sequelize.STRING(50), allowNull: true, unique: true },

          title: { type: Sequelize.STRING(500), allowNull: false },
          discipline: { type: Sequelize.STRING(150), allowNull: false },
          abstract: { type: Sequelize.TEXT, allowNull: true },
          background: { type: Sequelize.TEXT, allowNull: true },
          objectives: { type: Sequelize.TEXT, allowNull: true },
          methodology: { type: Sequelize.TEXT, allowNull: true },
          expected_outcome: { type: Sequelize.TEXT, allowNull: true },
          timeline: { type: Sequelize.TEXT, allowNull: true },
          team_members: { type: Sequelize.TEXT, allowNull: true },
          // `references` is a MySQL reserved word — Sequelize's DDL
          // builder quotes column names with backticks automatically,
          // so this is safe as a plain column identifier. The JS
          // attribute name stays `references` to match the Mongoose
          // schema and any controller code that reads it.
          references: { type: Sequelize.TEXT, allowNull: true },

          hypotheses: { type: Sequelize.TEXT, allowNull: true },
          literature_review_summary: { type: Sequelize.TEXT, allowNull: true },
          study_duration: { type: Sequelize.STRING(150), allowNull: true },
          study_sites: { type: Sequelize.JSON, allowNull: false },
          co_investigators: { type: Sequelize.JSON, allowNull: false },
          funding_source: { type: Sequelize.STRING(300), allowNull: true },
          ethics_information: { type: Sequelize.TEXT, allowNull: true },

          proposal_file: { type: Sequelize.STRING(500), allowNull: true },
          proposal_file_key: { type: Sequelize.STRING(255), allowNull: true },

          progress_data: { type: Sequelize.JSON, allowNull: false },
          progress_files: { type: Sequelize.JSON, allowNull: false },

          priority: {
            type: Sequelize.ENUM("high", "medium", "normal"),
            allowNull: false, defaultValue: "normal",
          },
          review_deadline: { type: Sequelize.DATE, allowNull: true },

          final_paper_file: { type: Sequelize.STRING(500), allowNull: true },
          final_paper_file_key: { type: Sequelize.STRING(255), allowNull: true },
          final_abstract: { type: Sequelize.TEXT, allowNull: true },
          keywords: { type: Sequelize.JSON, allowNull: false },
          final_paper_files: { type: Sequelize.JSON, allowNull: false },
          final_paper_submission: { type: Sequelize.JSON, allowNull: false },

          journal_name: { type: Sequelize.STRING(255), allowNull: true },
          journal_volume: { type: Sequelize.STRING(100), allowNull: true },
          journal_doi: { type: Sequelize.STRING(200), allowNull: true },

          stage: {
            type: Sequelize.ENUM("proposal", "progress", "final_paper"),
            allowNull: false, defaultValue: "proposal",
          },
          status: {
            type: Sequelize.ENUM(
              "draft", "awaiting_payment", "pending", "under_review",
              "revision_requested", "pending_committee_review",
              "approved", "rejected", "suspended",
            ),
            allowNull: false, defaultValue: "pending",
          },
          assigned_reviewer_id: {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
            references: { model: "researchers", key: "id" },
            onDelete: "SET NULL", onUpdate: "CASCADE",
          },
          assigned_at: { type: Sequelize.DATE, allowNull: true },

          proposal_review: { type: Sequelize.JSON, allowNull: false },
          progress_review: { type: Sequelize.JSON, allowNull: false },
          final_paper_review: { type: Sequelize.JSON, allowNull: false },

          review_comment: { type: Sequelize.TEXT, allowNull: true },
          reviewed_by_id: {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
            references: { model: "researchers", key: "id" },
            onDelete: "SET NULL", onUpdate: "CASCADE",
          },
          reviewed_at: { type: Sequelize.DATE, allowNull: true },

          resubmission_count: {
            type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0,
          },

          // FK to payments — constraint added in follow-up migration.
          submission_payment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },

          committee_round: {
            type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1,
          },
          committee_reviewed_by_id: {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
            references: { model: "researchers", key: "id" },
            onDelete: "SET NULL", onUpdate: "CASCADE",
          },
          committee_reviewed_at: { type: Sequelize.DATE, allowNull: true },
          committee_comment: { type: Sequelize.TEXT, allowNull: true },

          reactivated_at: { type: Sequelize.DATE, allowNull: true },
          reactivated_by_id: {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
            references: { model: "researchers", key: "id" },
            onDelete: "SET NULL", onUpdate: "CASCADE",
          },
          reactivation_reason: { type: Sequelize.STRING(500), allowNull: true },

          aggregate_score: { type: Sequelize.DECIMAL(4, 2), allowNull: true },
          review_decision: { type: Sequelize.STRING(50), allowNull: true },

          nacosti_permit: { type: Sequelize.STRING(100), allowNull: true },
          nacosti_submitted_at: { type: Sequelize.DATE, allowNull: true },

          // Circular FKs to certificates — added in follow-up migration.
          clearance_certificate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
          completion_certificate_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },

          is_published: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          published_at: { type: Sequelize.DATE, allowNull: true },
          download_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
          downloads: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
          views: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },

          is_deleted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          deleted_at: { type: Sequelize.DATE, allowNull: true },
          deleted_by_id: {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
            references: { model: "researchers", key: "id" },
            onDelete: "SET NULL", onUpdate: "CASCADE",
          },

          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction, charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" },
      );

      const idx = (fields, name) =>
        queryInterface.addIndex("researches", fields, { transaction, name });

      await idx(["researcher_id", "created_at"], "researches_researcher_created_idx");
      await idx(["stage", "status"], "researches_stage_status_idx");
      await idx(["is_published", "created_at"], "researches_published_created_idx");
      await idx(["is_published", "discipline"], "researches_published_discipline_idx");
      await idx(["assigned_reviewer_id", "status"], "researches_reviewer_status_idx");
      await idx(["is_deleted", "is_published"], "researches_deleted_published_idx");
      await idx(["title"], "researches_title_idx");
      await idx(["discipline"], "researches_discipline_idx");

      // FULLTEXT — replaces the Mongo weighted text index. Weights
      // aren't preserved (MySQL FULLTEXT has no per-column weights), so
      // if title-vs-abstract ranking matters at a call site, split into
      // multiple MATCH clauses. Keywords is JSON here and can't be
      // FULLTEXT-indexed; the trade-off is documented in the plan.
      await queryInterface.sequelize.query(
        `ALTER TABLE researches ADD FULLTEXT INDEX research_text_search
         (title, abstract, final_abstract, discipline)`,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("researches");
  },
};
