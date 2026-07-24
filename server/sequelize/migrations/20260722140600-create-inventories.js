"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "inventories",
        {
          id: {
            type: Sequelize.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
          },
          name: { type: Sequelize.STRING(200), allowNull: false },
          category: {
            type: Sequelize.ENUM("Medicine", "Equipment", "Consumable", "Other"),
            allowNull: false,
            defaultValue: "Other",
          },
          quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
          unit: { type: Sequelize.STRING(30), allowNull: false },
          price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
          supplier: { type: Sequelize.STRING(200), allowNull: true },
          batch: { type: Sequelize.STRING(100), allowNull: true },
          expiry: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
          min_threshold: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 5 },
          description: { type: Sequelize.TEXT, allowNull: true },
          // sparse unique — MySQL allows multiple NULLs on unique indexes,
          // matching Mongoose's `sparse: true` semantics.
          sku: { type: Sequelize.STRING(80), allowNull: true, unique: true },
          last_restocked: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          created_by: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
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

      await queryInterface.addIndex("inventories", ["expiry"], {
        transaction,
        name: "inventories_expiry_idx",
      });
      await queryInterface.addIndex("inventories", ["quantity"], {
        transaction,
        name: "inventories_quantity_idx",
      });
      await queryInterface.addIndex("inventories", ["category"], {
        transaction,
        name: "inventories_category_idx",
      });

      // FULLTEXT replacement for the Mongo text index on
      // name / category / supplier.
      await queryInterface.sequelize.query(
        "ALTER TABLE inventories ADD FULLTEXT INDEX inventories_text_search (name, supplier)",
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("inventories");
  },
};
