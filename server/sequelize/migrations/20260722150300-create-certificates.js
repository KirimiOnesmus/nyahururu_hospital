"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "certificates",
        {
          id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
          type: {
            type: Sequelize.ENUM("proposal_approval", "publication"),
            allowNull: false,
          },
          certificate_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
          research_id: {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
            references: { model: "researches", key: "id" },
            onDelete: "RESTRICT", onUpdate: "CASCADE",
          },
          researcher_id: {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
            references: { model: "researchers", key: "id" },
            onDelete: "RESTRICT", onUpdate: "CASCADE",
          },
          research_title: { type: Sequelize.STRING(500), allowNull: false },
          researcher_name: { type: Sequelize.STRING(150), allowNull: false },
          institution: { type: Sequelize.STRING(255), allowNull: true },
          study_sites: { type: Sequelize.JSON, allowNull: false },
          research_code: { type: Sequelize.STRING(100), allowNull: true },
          committee_approval_statement: { type: Sequelize.TEXT, allowNull: true },
          valid_from: { type: Sequelize.DATE, allowNull: true },
          valid_until: { type: Sequelize.DATE, allowNull: true },
          publication_date: { type: Sequelize.DATE, allowNull: true },
          journal_name: { type: Sequelize.STRING(255), allowNull: true },
          completion_statement: { type: Sequelize.TEXT, allowNull: true },
          verification_token: { type: Sequelize.STRING(64), allowNull: false },
          // MEDIUMTEXT — QR base64 PNGs can exceed the 64 KiB TEXT cap
          // once dimensions grow. MEDIUMTEXT goes up to 16 MiB.
          qr_code_data_url: { type: Sequelize.TEXT("medium"), allowNull: true },
          pdf_file: { type: Sequelize.STRING(500), allowNull: true },
          pdf_file_key: { type: Sequelize.STRING(255), allowNull: true },
          signature_area_label: {
            type: Sequelize.STRING(255), allowNull: false,
            defaultValue: "Director, Research & Ethics Committee",
          },
          seal_image_url: { type: Sequelize.STRING(500), allowNull: true, defaultValue: null },
          status: {
            type: Sequelize.ENUM("active", "revoked"),
            allowNull: false, defaultValue: "active",
          },
          revoked_at: { type: Sequelize.DATE, allowNull: true },
          revoked_by_id: {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
            references: { model: "researchers", key: "id" },
            onDelete: "SET NULL", onUpdate: "CASCADE",
          },
          revoked_reason: { type: Sequelize.STRING(500), allowNull: true },
          // Self-referential FK — supersession chain (a corrected cert
          // supersedes the original).
          supersedes_id: {
            type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
            references: { model: "certificates", key: "id" },
            onDelete: "SET NULL", onUpdate: "CASCADE",
          },
          issued_by_id: {
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
        queryInterface.addIndex("certificates", fields, { transaction, name });
      await idx(["type"], "certificates_type_idx");
      await idx(["status"], "certificates_status_idx");
      await idx(["research_id"], "certificates_research_idx");
      await idx(["research_id", "type"], "certificates_research_type_idx");
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("certificates");
  },
};
