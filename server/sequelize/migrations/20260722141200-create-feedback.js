"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "feedback",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          name: { type: Sequelize.STRING(150), allowNull: true },
          email: { type: Sequelize.STRING(255), allowNull: true },
          message: { type: Sequelize.TEXT, allowNull: false },
          // STRING(30), not ENUM — matches the Mongoose schema, which
          // had no enum constraint. See feedback model comment.
          status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "pending" },
          response: { type: Sequelize.TEXT, allowNull: true },
          responded_by: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
          },
          responded_by_name: { type: Sequelize.STRING(150), allowNull: true },
          responded_at: { type: Sequelize.DATE, allowNull: true },
          // No updated_at column — the Mongoose schema opted out of
          // timestamps and managed created_at manually.
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        {
          transaction,
          charset: "utf8mb4",
          collate: "utf8mb4_unicode_ci",
          engine: "InnoDB",
        },
      );

      await queryInterface.addIndex("feedback", ["status"], {
        transaction,
        name: "feedback_status_idx",
      });
      await queryInterface.addIndex("feedback", ["created_at"], {
        transaction,
        name: "feedback_created_at_idx",
      });
      await queryInterface.addIndex("feedback", ["email"], {
        transaction,
        name: "feedback_email_idx",
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("feedback");
  },
};
