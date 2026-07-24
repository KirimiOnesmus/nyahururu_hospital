"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "payments",
        {
          id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
          researcher_id: {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
            references: { model: "researchers", key: "id" },
            onDelete: "SET NULL", onUpdate: "CASCADE",
          },
          type: {
            type: Sequelize.ENUM("proposal_submission", "paper_download"),
            allowNull: false,
          },
          research_id: {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
            references: { model: "researches", key: "id" },
            onDelete: "RESTRICT", onUpdate: "CASCADE",
          },
          amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
          currency: { type: Sequelize.STRING(10), allowNull: false, defaultValue: "KES" },
          phone: { type: Sequelize.STRING(30), allowNull: false },
          buyer_email: { type: Sequelize.STRING(255), allowNull: true, defaultValue: null },
          merchant_request_id: { type: Sequelize.STRING(100), allowNull: true },
          checkout_request_id: { type: Sequelize.STRING(100), allowNull: true, unique: true },
          // sparse unique via MySQL's default multi-NULL semantics
          mpesa_receipt_number: { type: Sequelize.STRING(50), allowNull: true, unique: true },
          transaction_date: { type: Sequelize.STRING(30), allowNull: true },
          status: {
            type: Sequelize.ENUM("pending", "completed", "failed", "cancelled", "refunded"),
            allowNull: false, defaultValue: "pending",
          },
          result_code: { type: Sequelize.STRING(20), allowNull: true },
          result_desc: { type: Sequelize.STRING(500), allowNull: true },
          refunded_at: { type: Sequelize.DATE, allowNull: true },
          refund_reason: { type: Sequelize.STRING(500), allowNull: true },
          refund_code: { type: Sequelize.STRING(50), allowNull: true },
          refund_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          download_token: { type: Sequelize.STRING(255), allowNull: true },
          download_token_expire: { type: Sequelize.DATE, allowNull: true },
          downloaded_at: { type: Sequelize.DATE, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction, charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" },
      );

      const idx = (fields, name) =>
        queryInterface.addIndex("payments", fields, { transaction, name });
      await idx(["status", "type"], "payments_status_type_idx");
      await idx(["researcher_id", "type"], "payments_researcher_type_idx");
      await idx(["research_id", "status"], "payments_research_status_idx");
      await idx(["created_at"], "payments_created_at_idx");
      await idx(["phone"], "payments_phone_idx");
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("payments");
  },
};
