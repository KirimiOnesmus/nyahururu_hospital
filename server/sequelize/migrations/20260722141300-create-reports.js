"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "reports",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          title: { type: Sequelize.STRING(300), allowNull: false },
          category: {
            type: Sequelize.ENUM(
              "operations",
              "financial",
              "inventory",
              "logistics",
              "hr",
              "procurement",
            ),
            allowNull: false,
          },
          type: {
            type: Sequelize.ENUM("pdf", "excel", "word", "zip", "image"),
            allowNull: false,
          },
          period: {
            type: Sequelize.ENUM("Monthly", "Quarterly", "Yearly", "Custom"),
            allowNull: false,
          },
          custom_start_date: { type: Sequelize.DATE, allowNull: true },
          custom_end_date: { type: Sequelize.DATE, allowNull: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          file_url: { type: Sequelize.STRING(500), allowNull: false },
          file_name: { type: Sequelize.STRING(255), allowNull: false },
          file_size: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
          status: {
            type: Sequelize.ENUM("draft", "published", "archived"),
            allowNull: false,
            defaultValue: "draft",
          },
          uploaded_by: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
          },
          views: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
          downloads: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
          tags: { type: Sequelize.JSON, allowNull: false },
          comments: { type: Sequelize.JSON, allowNull: false },
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

      await queryInterface.addIndex("reports", ["category", "status"], {
        transaction,
        name: "reports_category_status_idx",
      });
      await queryInterface.addIndex("reports", ["uploaded_by"], {
        transaction,
        name: "reports_uploaded_by_idx",
      });
      await queryInterface.addIndex("reports", ["type"], {
        transaction,
        name: "reports_type_idx",
      });
      await queryInterface.addIndex("reports", ["period"], {
        transaction,
        name: "reports_period_idx",
      });

      // FULLTEXT replacement for the Mongo text index on title+description.
      await queryInterface.sequelize.query(
        "ALTER TABLE reports ADD FULLTEXT INDEX reports_text_search (title, description)",
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("reports");
  },
};
