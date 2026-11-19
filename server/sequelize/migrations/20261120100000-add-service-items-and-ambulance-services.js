"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("service_items", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      service_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      import_key: { type: Sequelize.STRING(100), allowNull: true, unique: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      sha_covered: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      cash_price: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      sha_price: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      sort_order: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      last_import_batch_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });
    await queryInterface.addConstraint("service_items", {
      fields: ["service_id"], type: "foreign key", name: "service_items_service_id_fk",
      references: { table: "services", field: "id" }, onUpdate: "CASCADE", onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("service_items", {
      fields: ["last_import_batch_id"], type: "foreign key", name: "service_items_import_batch_fk",
      references: { table: "import_batches", field: "id" }, onUpdate: "CASCADE", onDelete: "SET NULL",
    });
    await queryInterface.addIndex("service_items", ["service_id", "sha_covered", "sort_order"], { name: "service_items_service_coverage_order_idx" });

    await queryInterface.createTable("ambulance_services", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      import_key: { type: Sequelize.STRING(100), allowNull: true, unique: true },
      name: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      cash_price: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      sha_price: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      sha_covered: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      sort_order: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      last_import_batch_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });
    await queryInterface.addConstraint("ambulance_services", {
      fields: ["last_import_batch_id"], type: "foreign key", name: "ambulance_services_import_batch_fk",
      references: { table: "import_batches", field: "id" }, onUpdate: "CASCADE", onDelete: "SET NULL",
    });
    await queryInterface.addIndex("ambulance_services", ["is_active", "sort_order"], { name: "ambulance_services_active_order_idx" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ambulance_services");
    await queryInterface.dropTable("service_items");
  },
};
