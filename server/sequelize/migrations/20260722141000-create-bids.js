"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "bids",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          tender_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            references: { model: "tenders", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
          },
          tender_number: { type: Sequelize.STRING(50), allowNull: false },

          // Vendor
          vendor_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
          },
          vendor_name: { type: Sequelize.STRING(200), allowNull: false },
          vendor_email: { type: Sequelize.STRING(255), allowNull: false },
          vendor_phone: { type: Sequelize.STRING(30), allowNull: true },
          vendor_company: { type: Sequelize.STRING(200), allowNull: true },
          vendor_address: { type: Sequelize.JSON, allowNull: false },

          // Financial
          bid_amount: { type: Sequelize.DECIMAL(16, 2), allowNull: false },
          formatted_bid_amount: { type: Sequelize.STRING(50), allowNull: true },
          currency: {
            type: Sequelize.ENUM("USD", "EUR", "GBP", "KES", "UGX"),
            allowNull: false,
            defaultValue: "USD",
          },
          payment_terms: { type: Sequelize.STRING(500), allowNull: true },
          tax_rate: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },

          // Proposal
          technical_proposal: { type: Sequelize.TEXT, allowNull: false },
          financial_proposal: { type: Sequelize.TEXT, allowNull: true },
          executive_summary: { type: Sequelize.TEXT, allowNull: true },
          methodology: { type: Sequelize.TEXT, allowNull: true },
          key_personnel: { type: Sequelize.JSON, allowNull: false },
          milestones: { type: Sequelize.JSON, allowNull: false },
          compliance: { type: Sequelize.JSON, allowNull: false },
          documents: { type: Sequelize.JSON, allowNull: false },

          // Timeline
          delivery_timeline: { type: Sequelize.STRING(500), allowNull: true },
          start_date: { type: Sequelize.DATE, allowNull: true },
          completion_date: { type: Sequelize.DATE, allowNull: true },
          warranty_terms: { type: Sequelize.TEXT, allowNull: true },
          warranty_period: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
          maintenance_support: { type: Sequelize.TEXT, allowNull: true },

          // Status
          status: {
            type: Sequelize.ENUM(
              "draft",
              "submitted",
              "under_review",
              "shortlisted",
              "rejected",
              "awarded",
              "withdrawn",
            ),
            allowNull: false,
            defaultValue: "submitted",
          },
          rejection_reason: { type: Sequelize.TEXT, allowNull: true },

          // Scoring — flattened from Mongoose's nested score.* so the
          // compound index below on score_overall is a real index.
          score_technical: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          score_financial: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          score_compliance: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          score_experience: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          score_overall: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },

          evaluation_criteria: { type: Sequelize.JSON, allowNull: false },
          evaluation_notes: { type: Sequelize.TEXT, allowNull: true, defaultValue: "" },
          strengths: { type: Sequelize.JSON, allowNull: false },
          weaknesses: { type: Sequelize.JSON, allowNull: false },
          recommendations: { type: Sequelize.TEXT, allowNull: true },

          evaluated_by: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
          },
          evaluated_by_name: { type: Sequelize.STRING(150), allowNull: true },
          evaluated_at: { type: Sequelize.DATE, allowNull: true },
          evaluators: { type: Sequelize.JSON, allowNull: false },

          submission_date: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          last_modified_date: { type: Sequelize.DATE, allowNull: true },
          withdrawn_date: { type: Sequelize.DATE, allowNull: true },

          comments: { type: Sequelize.JSON, allowNull: false },
          clarifications: { type: Sequelize.JSON, allowNull: false },
          cost_breakdown: { type: Sequelize.JSON, allowNull: false },

          ranking: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
          is_lowest_bid: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          price_competitiveness: {
            type: Sequelize.ENUM(
              "highly_competitive",
              "competitive",
              "average",
              "above_average",
              "expensive",
            ),
            allowNull: true,
          },

          vendor_past_performance: { type: Sequelize.JSON, allowNull: false },
          risk_level: {
            type: Sequelize.ENUM("low", "medium", "high", "critical"),
            allowNull: false,
            defaultValue: "medium",
          },
          identified_risks: { type: Sequelize.JSON, allowNull: false },

          is_confidential: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          tags: { type: Sequelize.JSON, allowNull: false },
          flags: { type: Sequelize.JSON, allowNull: false },
          activity_log: { type: Sequelize.JSON, allowNull: false },

          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          transaction,
          charset: "utf8mb4",
          collate: "utf8mb4_unicode_ci",
          engine: "InnoDB",
        },
      );

      // All indexes from the Mongoose model, translated 1:1.
      const idx = (fields, name) =>
        queryInterface.addIndex("bids", fields, { transaction, name });

      await idx(["tender_id", "status"], "bids_tender_status_idx");
      await idx(["vendor_id", "submission_date"], "bids_vendor_submission_idx");
      await idx(["status", "submission_date"], "bids_status_submission_idx");
      await idx(["score_overall"], "bids_score_overall_idx");
      await idx(["bid_amount"], "bids_bid_amount_idx");
      await idx(["ranking"], "bids_ranking_idx");
      await idx(["tender_number"], "bids_tender_number_idx");
      await idx(
        ["tender_id", "score_overall", "bid_amount"],
        "bids_tender_score_amount_idx",
      );
      await idx(["status", "evaluated_at"], "bids_status_evaluated_at_idx");
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("bids");
  },
};
