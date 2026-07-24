"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "gallery",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          type: {
            type: Sequelize.ENUM("image", "video"),
            allowNull: false,
          },
          category: { type: Sequelize.STRING(100), allowNull: false },
          file_url: { type: Sequelize.STRING(500), allowNull: false },
          thumbnail_url: { type: Sequelize.STRING(500), allowNull: true },
          file_name: { type: Sequelize.STRING(255), allowNull: false },
          file_size: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
          mime_type: { type: Sequelize.STRING(100), allowNull: true },
          tags: { type: Sequelize.JSON, allowNull: false },
          visible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          views: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
          likes: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
          uploaded_by: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
          },
          upload_date: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
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

      await queryInterface.addIndex("gallery", ["category"], {
        transaction,
        name: "gallery_category_idx",
      });
      await queryInterface.addIndex("gallery", ["type"], {
        transaction,
        name: "gallery_type_idx",
      });
      await queryInterface.addIndex("gallery", ["visible"], {
        transaction,
        name: "gallery_visible_idx",
      });
      await queryInterface.addIndex("gallery", ["upload_date"], {
        transaction,
        name: "gallery_upload_date_idx",
      });

      // FULLTEXT on title + description — matches the Mongo text index.
      // (tags was in the Mongo text index too, but it's a JSON column here
      // and MySQL FULLTEXT can't index INTO JSON. Tags remain filterable
      // via JSON_CONTAINS at query time; text search covers the prose
      // fields where it matters most.)
      await queryInterface.sequelize.query(
        "ALTER TABLE gallery ADD FULLTEXT INDEX gallery_text_search (title, description)",
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("gallery");
  },
};
