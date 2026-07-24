"use strict";

const CATEGORIES = [
  "Medical Equipment",
  "Drugs & Pharmaceuticals",
  "ICT Services",
  "Construction",
  "Maintenance",
  "Consultancy",
  "Laboratory Supplies",
  "Food Services",
  "Other",
];

const VISIBILITIES = ["public", "internal", "restricted"];
const STATUSES = ["draft", "active", "closed", "under_evaluation", "awarded", "cancelled"];

module.exports = (sequelize, DataTypes) => {
  const Tender = sequelize.define(
    "Tender",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      tenderNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        // Set by the beforeValidate hook via the Counter model — see
        // below. Nullable-at-JS-level lets `new Tender()` construct
        // without a number, which the hook then fills in atomically.
      },
      title: {
        type: DataTypes.STRING(300),
        allowNull: false,
        validate: { notEmpty: true },
      },
      category: {
        type: DataTypes.ENUM(...CATEGORIES),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
      scopeOfWork: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
      eligibilityCriteria: { type: DataTypes.TEXT, defaultValue: "" },
      requiredDocuments: { type: DataTypes.TEXT, defaultValue: "" },
      deliverables: { type: DataTypes.TEXT, defaultValue: "" },

      // Money — DECIMAL, not float. Tenders can run into the millions;
      // DECIMAL(14,2) covers up to ~1 trillion cents.
      budgetMin: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      budgetMax: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      // Human-readable "$X - $Y" cache of the two numbers above — filled
      // in by the beforeSave hook. Preserved from the Mongoose model so
      // list views don't have to reformat on every render.
      budgetRange: { type: DataTypes.STRING(100), defaultValue: "" },

      publicationDate: { type: DataTypes.DATE, allowNull: false },
      submissionDeadline: { type: DataTypes.DATE, allowNull: false },
      evaluationDate: DataTypes.DATE,

      visibility: {
        type: DataTypes.ENUM(...VISIBILITIES),
        allowNull: false,
        defaultValue: "public",
      },
      status: {
        type: DataTypes.ENUM(...STATUSES),
        allowNull: false,
        defaultValue: "draft",
      },

      // JSON: attachments and activity-log entries are always fetched
      // wholesale with the tender, never joined or aggregated across
      // tenders. See MIGRATION_PLAN.md for the rationale.
      attachments: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      activityLog: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },

      bidsReceived: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      awardedTo: DataTypes.STRING(255),

      // Circular FK to bids(id) — enforced in a separate follow-up
      // migration (20260722141100) so the two CREATE TABLEs don't
      // deadlock on each other. Column type matches for when the FK
      // constraint is added.
      awardedBidId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },

      createdBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      // Denormalized for the same reason as fraud_reports.reviewed_by_name:
      // survives account deactivation/anonymisation.
      createdByName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      updatedBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "tenders",
      indexes: [
        { unique: true, fields: ["tender_number"] },
        { fields: ["status", "category"] },
        { fields: ["submission_deadline"] },
        { fields: ["created_by"] },
      ],
      hooks: {
        beforeValidate: async (tender, options) => {
          // Atomic per-year sequence via the Counter model — fixes the
          // TOCTOU race in the original Mongoose `countDocuments()`
          // approach, which under concurrent tender creation would
          // hand out duplicate tender numbers. The Counter model uses
          // INSERT ... ON DUPLICATE KEY UPDATE seq = seq + 1, which is
          // a single atomic statement at the MySQL level.
          if (!tender.tenderNumber) {
            const year = new Date().getFullYear();
            const seq = await sequelize.models.Counter.incrementAndGet(
              `tender-${year}`,
              { transaction: options.transaction },
            );
            tender.tenderNumber = `TND-${year}-${String(seq).padStart(3, "0")}`;
          }
        },
        beforeSave: (tender) => {
          const min = Number(tender.budgetMin) || 0;
          const max = Number(tender.budgetMax) || 0;
          if (min && max) {
            tender.budgetRange = `$${min.toLocaleString()} - $${max.toLocaleString()}`;
          }
        },
      },
    },
  );

  // Virtual — same as the Mongoose model's, exposed as a getter so it
  // stays computed on read rather than persisted (avoids write-time drift
  // between budgetRange and the underlying min/max).
  Object.defineProperty(Tender.prototype, "formattedBudgetRange", {
    get() {
      const min = Number(this.budgetMin) || 0;
      const max = Number(this.budgetMax) || 0;
      if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
      return "Not specified";
    },
  });

  Tender.associate = (models) => {
    Tender.belongsTo(models.User, { foreignKey: "createdBy", as: "creator" });
    Tender.belongsTo(models.User, { foreignKey: "updatedBy", as: "updater" });
    if (models.Bid) {
      Tender.hasMany(models.Bid, { foreignKey: "tenderId", as: "bids" });
      // Association is defined without a DB-level constraint for the
      // circular awarded_bid_id; the constraint is added in the
      // follow-up migration referenced above.
      Tender.belongsTo(models.Bid, {
        foreignKey: "awardedBidId",
        as: "awardedBid",
        constraints: false,
      });
    }
  };

  Tender.CATEGORIES = CATEGORIES;
  Tender.VISIBILITIES = VISIBILITIES;
  Tender.STATUSES = STATUSES;

  return Tender;
};
