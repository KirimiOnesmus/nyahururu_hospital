"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "tenders",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          tender_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
          title: { type: Sequelize.STRING(300), allowNull: false },
          category: {
            type: Sequelize.ENUM(
              "Medical Equipment",
              "Drugs & Pharmaceuticals",
              "ICT Services",
              "Construction",
              "Maintenance",
              "Consultancy",
              "Laboratory Supplies",
              "Food Services",
              "Other",
            ),
            allowNull: false,
          },
          description: { type: Sequelize.TEXT, allowNull: false },
          scope_of_work: { type: Sequelize.TEXT, allowNull: false },
          eligibility_criteria: { type: Sequelize.TEXT, allowNull: true },
          required_documents: { type: Sequelize.TEXT, allowNull: true },
          deliverables: { type: Sequelize.TEXT, allowNull: true },
          budget_min: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
          budget_max: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
          budget_range: { type: Sequelize.STRING(100), allowNull: true, defaultValue: "" },
          publication_date: { type: Sequelize.DATE, allowNull: false },
          submission_deadline: { type: Sequelize.DATE, allowNull: false },
          evaluation_date: { type: Sequelize.DATE, allowNull: true },
          visibility: {
            type: Sequelize.ENUM("public", "internal", "restricted"),
            allowNull: false,
            defaultValue: "public",
          },
          status: {
            type: Sequelize.ENUM(
              "draft",
              "active",
              "closed",
              "under_evaluation",
              "awarded",
              "cancelled",
            ),
            allowNull: false,
            defaultValue: "draft",
          },
          attachments: { type: Sequelize.JSON, allowNull: false },
          activity_log: { type: Sequelize.JSON, allowNull: false },
          bids_received: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
          },
          awarded_to: { type: Sequelize.STRING(255), allowNull: true, defaultValue: null },
          // FK to bids(id) added in 20260722141100 — bids depends on
          // tenders, so we can't reference bids here without deadlocking
          // creation order.
          awarded_bid_id: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            defaultValue: null,
          },
          created_by: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
          },
          created_by_name: { type: Sequelize.STRING(150), allowNull: false },
          updated_by: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
          },
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

      await queryInterface.addIndex("tenders", ["status", "category"], {
        transaction,
        name: "tenders_status_category_idx",
      });
      await queryInterface.addIndex("tenders", ["submission_deadline"], {
        transaction,
        name: "tenders_submission_deadline_idx",
      });
      await queryInterface.addIndex("tenders", ["created_by"], {
        transaction,
        name: "tenders_created_by_idx",
      });

      await queryInterface.sequelize.query(
        "ALTER TABLE tenders ADD FULLTEXT INDEX tenders_text_search (title, description, tender_number)",
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tenders");
  },
};
