"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    await qi.addColumn("users", "last_login", { type: Sequelize.DATE, allowNull: true });
    await qi.addColumn("services", "cash_min", { type: Sequelize.DECIMAL(12, 2), allowNull: true });
    await qi.addColumn("services", "cash_max", { type: Sequelize.DECIMAL(12, 2), allowNull: true });
    await qi.addColumn("services", "sha_min", { type: Sequelize.DECIMAL(12, 2), allowNull: true });
    await qi.addColumn("services", "sha_max", { type: Sequelize.DECIMAL(12, 2), allowNull: true });
    await qi.addColumn("services", "items_total", { type: Sequelize.INTEGER.UNSIGNED, allowNull: true });
    await qi.addColumn("services", "items_sha_covered", { type: Sequelize.INTEGER.UNSIGNED, allowNull: true });
    await qi.addColumn("services", "sha_coverage", {
      type: Sequelize.ENUM("none", "partial", "full"), allowNull: true, defaultValue: null,
    });
    await qi.addColumn("services", "is_published", { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true });
    await qi.addColumn("services", "sort_order", { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 100 });
    await qi.addColumn("services", "last_import_batch_id", { type: Sequelize.BIGINT.UNSIGNED, allowNull: true });
    await qi.addIndex("services", ["is_published", "division", "category"], { name: "services_published_division_category_idx" });
    await qi.addIndex("services", ["sort_order"], { name: "services_sort_order_idx" });

    await qi.createTable("import_batches", {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      entity: { type: Sequelize.STRING(60), allowNull: false },
      tier: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false },
      mode: { type: Sequelize.STRING(20), allowNull: false },
      status: {
        type: Sequelize.ENUM("failed", "validated", "awaiting_approval", "committed", "discarded", "rolled_back", "expired"),
        allowNull: false,
      },
      original_filename: { type: Sequelize.STRING(255), allowNull: false },
      file_sha256: { type: Sequelize.CHAR(64), allowNull: false },
      file_size: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      row_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      created_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      updated_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      unchanged_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      error_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      warning_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      errors: { type: Sequelize.JSON, allowNull: true },
      warnings: { type: Sequelize.JSON, allowNull: true },
      preview: { type: Sequelize.JSON, allowNull: true },
      payload: { type: Sequelize.JSON, allowNull: true },
      before_snapshot: { type: Sequelize.JSON, allowNull: true },
      uploaded_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      approved_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      committed_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      rolled_back_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      committed_at: { type: Sequelize.DATE, allowNull: true },
      rolled_back_at: { type: Sequelize.DATE, allowNull: true },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    }, { charset: "utf8mb4", collate: "utf8mb4_unicode_ci", engine: "InnoDB" });
    await qi.addIndex("import_batches", ["entity", "status"], { name: "import_batches_entity_status_idx" });
    await qi.addIndex("import_batches", ["file_sha256", "entity"], { name: "import_batches_hash_entity_idx" });
    await qi.addIndex("import_batches", ["uploaded_by"], { name: "import_batches_uploaded_by_idx" });
    await qi.addIndex("import_batches", ["expires_at"], { name: "import_batches_expires_at_idx" });
    for (const field of ["uploaded_by", "approved_by", "committed_by", "rolled_back_by"]) {
      await qi.addConstraint("import_batches", {
        fields: [field], type: "foreign key", name: `import_batches_${field}_fk`,
        references: { table: "users", field: "id" }, onUpdate: "CASCADE", onDelete: "SET NULL",
      });
    }
    await qi.addConstraint("services", {
      fields: ["last_import_batch_id"], type: "foreign key", name: "services_last_import_batch_fk",
      references: { table: "import_batches", field: "id" }, onUpdate: "CASCADE", onDelete: "SET NULL",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint("services", "services_last_import_batch_fk");
    await queryInterface.dropTable("import_batches");
    await queryInterface.removeColumn("users", "last_login");
    await queryInterface.removeIndex("services", "services_sort_order_idx");
    await queryInterface.removeIndex("services", "services_published_division_category_idx");
    for (const column of ["last_import_batch_id", "sort_order", "is_published", "sha_coverage", "items_sha_covered", "items_total", "sha_max", "sha_min", "cash_max", "cash_min"]) {
      await queryInterface.removeColumn("services", column);
    }
  },
};
