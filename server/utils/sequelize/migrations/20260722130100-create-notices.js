"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "notices",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          content: { type: Sequelize.TEXT, allowNull: false },
          category: {
            type: Sequelize.ENUM(
              "General",
              "Emergency",
              "Event",
              "System Update",
              "Policy",
              "Maintenance",
              "Health Advisory",
            ),
            allowNull: false,
          },
          audience: {
            type: Sequelize.ENUM(
              "All",
              "Staff",
              "Patients",
              "Doctors",
              "Nurses",
              "Public",
              "Specific Department",
            ),
            allowNull: false,
          },
          start_date: { type: Sequelize.DATE, allowNull: false },
          start_time: { type: Sequelize.STRING(8), allowNull: false, defaultValue: "00:00" },
          end_date: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
          end_time: { type: Sequelize.STRING(8), allowNull: false, defaultValue: "23:59" },
          status: {
            type: Sequelize.ENUM("active", "scheduled", "expired", "hidden"),
            allowNull: false,
            defaultValue: "active",
          },
          visible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          send_notification: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          attachments: { type: Sequelize.JSON, allowNull: false },
          views: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
          created_by: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
          },
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

      await queryInterface.addIndex("notices", ["category"], {
        transaction,
        name: "notices_category_idx",
      });
      await queryInterface.addIndex("notices", ["audience"], {
        transaction,
        name: "notices_audience_idx",
      });
      await queryInterface.addIndex("notices", ["status"], {
        transaction,
        name: "notices_status_idx",
      });
      await queryInterface.addIndex("notices", ["start_date"], {
        transaction,
        name: "notices_start_date_idx",
      });

      // MySQL FULLTEXT equivalent of the Mongo text index on title/content.
      await queryInterface.sequelize.query(
        "ALTER TABLE notices ADD FULLTEXT INDEX notices_text_search (title, content)",
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("notices");
  },
};
