"use strict";

const CURRENCIES = ["USD", "EUR", "GBP", "KES", "UGX"];
const STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "shortlisted",
  "rejected",
  "awarded",
  "withdrawn",
];
const RISK_LEVELS = ["low", "medium", "high", "critical"];
const COMPETITIVENESS_LEVELS = [
  "highly_competitive",
  "competitive",
  "average",
  "above_average",
  "expensive",
];

// Statuses that count toward tender.bidsReceived — draft/withdrawn are
// intentionally excluded, matching the Mongoose post-save hook.
const COUNTABLE_STATUSES = STATUSES.filter((s) => !["draft", "withdrawn"].includes(s));

// Weighted overall score, matching the Mongoose model exactly. Kept as a
// module constant so the same weights are used by any downstream service
// that recomputes scores without going through save().
const SCORE_WEIGHTS = {
  technical: 0.4,
  financial: 0.3,
  compliance: 0.2,
  experience: 0.1,
};

module.exports = (sequelize, DataTypes) => {
  const Bid = sequelize.define(
    "Bid",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      tenderId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "tenders", key: "id" },
        // Deleting a tender should NOT wipe historical bid submissions
        // — procurement audit trails need the records intact even when
        // the parent tender is cancelled. Use RESTRICT to force a
        // deliberate cleanup path.
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      // Denormalized copy — same treatment as tenders.created_by_name.
      // Survives rename or eventual archival of the parent tender row.
      tenderNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      // ── Vendor ──────────────────────────────────────────────────────
      vendorId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      vendorName: { type: DataTypes.STRING(200), allowNull: false },
      vendorEmail: {
        type: DataTypes.STRING(255),
        allowNull: false,
        set(value) {
          this.setDataValue(
            "vendorEmail",
            value ? value.trim().toLowerCase() : value,
          );
        },
      },
      vendorPhone: DataTypes.STRING(30),
      vendorCompany: DataTypes.STRING(200),
      // Small nested object, never queried by sub-field — JSON is fine.
      // Shape: { street, city, state, zipCode, country }.
      vendorAddress: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },

      // ── Financial ───────────────────────────────────────────────────
      // DECIMAL(16,2) — tenders in this domain range up to millions of
      // dollars, DECIMAL preserves exact cents where FLOAT would drift.
      bidAmount: {
        type: DataTypes.DECIMAL(16, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      // Pre-formatted "USD 1,234,567.00" cache — filled by beforeSave.
      formattedBidAmount: DataTypes.STRING(50),
      currency: {
        type: DataTypes.ENUM(...CURRENCIES),
        allowNull: false,
        defaultValue: "USD",
      },
      paymentTerms: DataTypes.STRING(500),
      taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0, max: 100 },
      },

      // ── Proposal ────────────────────────────────────────────────────
      technicalProposal: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
      financialProposal: DataTypes.TEXT,
      executiveSummary: DataTypes.TEXT,
      methodology: DataTypes.TEXT,
      // JSON arrays — each is set once at submission, updated wholesale
      // if edited, never queried across bids. Full audit of the
      // JSON-vs-table decision lives in MIGRATION_PLAN.md.
      keyPersonnel: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      milestones: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      compliance: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      documents: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },

      // ── Timeline ────────────────────────────────────────────────────
      deliveryTimeline: DataTypes.STRING(500),
      startDate: DataTypes.DATE,
      completionDate: DataTypes.DATE,
      warrantyTerms: DataTypes.TEXT,
      warrantyPeriod: {
        type: DataTypes.INTEGER.UNSIGNED, // months
        validate: { min: 0 },
      },
      maintenanceSupport: DataTypes.TEXT,

      // ── Status ──────────────────────────────────────────────────────
      status: {
        type: DataTypes.ENUM(...STATUSES),
        allowNull: false,
        defaultValue: "submitted",
      },
      rejectionReason: DataTypes.TEXT,

      // ── Scoring — FLATTENED, not JSON ───────────────────────────────
      // The Mongoose model kept these in a nested `score.*` object; here
      // they're real columns so the existing compound index on
      // `score.overall` (used for ranking bids per tender) can be a
      // proper MySQL index rather than a JSON path expression.
      scoreTechnical: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0, max: 100 },
      },
      scoreFinancial: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0, max: 100 },
      },
      scoreCompliance: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0, max: 100 },
      },
      scoreExperience: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0, max: 100 },
      },
      scoreOverall: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0, max: 100 },
      },

      evaluationCriteria: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      evaluationNotes: { type: DataTypes.TEXT, defaultValue: "" },
      strengths: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      weaknesses: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      recommendations: DataTypes.TEXT,

      evaluatedBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      evaluatedByName: DataTypes.STRING(150),
      evaluatedAt: DataTypes.DATE,
      // Per-evaluator submissions — JSON since a bid controller updates
      // the full list on each evaluator submission (append/update
      // pattern, same as comments/clarifications).
      evaluators: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },

      // ── Dates ───────────────────────────────────────────────────────
      submissionDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      lastModifiedDate: DataTypes.DATE,
      withdrawnDate: DataTypes.DATE,

      // ── Communication / analysis ────────────────────────────────────
      comments: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      clarifications: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      costBreakdown: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },

      ranking: {
        type: DataTypes.INTEGER.UNSIGNED,
        validate: { min: 0 },
      },
      isLowestBid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      priceCompetitiveness: {
        type: DataTypes.ENUM(...COMPETITIVENESS_LEVELS),
        allowNull: true,
      },

      // ── Vendor history / risk ───────────────────────────────────────
      vendorPastPerformance: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      riskLevel: {
        type: DataTypes.ENUM(...RISK_LEVELS),
        allowNull: false,
        defaultValue: "medium",
      },
      identifiedRisks: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },

      // ── Metadata ────────────────────────────────────────────────────
      isConfidential: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tags: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      flags: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      activityLog: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    },
    {
      tableName: "bids",
      indexes: [
        { fields: ["tender_id", "status"] },
        { fields: ["vendor_id", "submission_date"] },
        { fields: ["status", "submission_date"] },
        { fields: ["score_overall"] },
        { fields: ["bid_amount"] },
        { fields: ["ranking"] },
        { fields: ["tender_number"] },
        { fields: ["tender_id", "score_overall", "bid_amount"] },
        { fields: ["status", "evaluated_at"] },
      ],
      hooks: {
        beforeSave: (bid) => {
          // Human-readable amount cache.
          if (bid.bidAmount !== null && bid.bidAmount !== undefined) {
            const amount = Number(bid.bidAmount).toLocaleString();
            bid.formattedBidAmount = `${bid.currency} ${amount}`;
          }

          // Weighted overall score. Recomputed on every save so any
          // subset of the four component scores changing keeps overall
          // in sync — matches the Mongoose pre-save hook's behaviour.
          const t = Number(bid.scoreTechnical) || 0;
          const f = Number(bid.scoreFinancial) || 0;
          const c = Number(bid.scoreCompliance) || 0;
          const e = Number(bid.scoreExperience) || 0;
          if (t || f || c || e) {
            const overall =
              t * SCORE_WEIGHTS.technical +
              f * SCORE_WEIGHTS.financial +
              c * SCORE_WEIGHTS.compliance +
              e * SCORE_WEIGHTS.experience;
            bid.scoreOverall = Math.round(overall * 100) / 100;
          }

          // Track last-modification separately from Sequelize's
          // updatedAt — the Mongoose model did the same, exposed via a
          // separate API field. Only touch it on updates, not inserts.
          if (!bid.isNewRecord) {
            bid.lastModifiedDate = new Date();
          }
        },

        // Cross-model side effect: keep tenders.bids_received in sync
        // with the count of countable bids (draft/withdrawn excluded).
        // Ported from Mongoose's post('save')/post('remove') hooks.
        // Uses sequelize.models to avoid a require-cycle with Tender.
        afterSave: async (bid, options) => {
          await Bid._syncTenderBidCount(bid.tenderId, options);
        },
        afterDestroy: async (bid, options) => {
          await Bid._syncTenderBidCount(bid.tenderId, options);
        },
      },
    },
  );

  /**
   * Recomputes tenders.bids_received for a tender. Called from the
   * afterSave/afterDestroy hooks and available for direct use from
   * services that bypass hooks (bulk operations, migrations, etc).
   */
  Bid._syncTenderBidCount = async function _syncTenderBidCount(tenderId, options = {}) {
    if (!tenderId) return;
    const { transaction } = options;
    const Tender = sequelize.models.Tender;
    if (!Tender) return;
    const count = await Bid.count({
      where: { tenderId, status: COUNTABLE_STATUSES },
      transaction,
    });
    await Tender.update(
      { bidsReceived: count },
      { where: { id: tenderId }, transaction, hooks: false, silent: true },
    );
  };

  // ── Virtuals (getters — never persisted) ──────────────────────────
  Object.defineProperty(Bid.prototype, "daysSinceSubmission", {
    get() {
      if (!this.submissionDate) return 0;
      const diff = Math.abs(Date.now() - new Date(this.submissionDate).getTime());
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    },
  });
  Object.defineProperty(Bid.prototype, "totalCostWithTax", {
    get() {
      const amount = Number(this.bidAmount) || 0;
      const rate = Number(this.taxRate) || 0;
      if (!rate) return amount;
      return amount + (amount * rate) / 100;
    },
  });
  Object.defineProperty(Bid.prototype, "evaluationProgress", {
    get() {
      const scores = [
        Number(this.scoreTechnical) || 0,
        Number(this.scoreFinancial) || 0,
        Number(this.scoreCompliance) || 0,
        Number(this.scoreExperience) || 0,
      ];
      const evaluated = scores.filter((s) => s > 0).length;
      return (evaluated / scores.length) * 100;
    },
  });

  // ── Instance / static methods (port from Mongoose) ────────────────

  /**
   * Aggregate stats across a tender's bids. Ported from the Mongoose
   * static of the same name — same fields, same semantics.
   */
  Bid.getBidStatistics = async function getBidStatistics(tenderId) {
    const { fn, col } = sequelize;
    const [row] = await Bid.findAll({
      where: { tenderId },
      attributes: [
        [fn("COUNT", col("id")), "totalBids"],
        [fn("AVG", col("bid_amount")), "averageBid"],
        [fn("MIN", col("bid_amount")), "lowestBid"],
        [fn("MAX", col("bid_amount")), "highestBid"],
        [fn("AVG", col("score_overall")), "averageScore"],
      ],
      raw: true,
    });
    if (!row || Number(row.totalBids) === 0) return null;
    return {
      totalBids: Number(row.totalBids),
      averageBid: Number(row.averageBid),
      lowestBid: Number(row.lowestBid),
      highestBid: Number(row.highestBid),
      averageScore: Number(row.averageScore),
    };
  };

  Bid.prototype.addActivityLog = function addActivityLog(action, description, user) {
    const entry = {
      action,
      description,
      performedBy: user?.id ?? user?._id ?? null,
      performedByName: user?.name ?? "",
      timestamp: new Date().toISOString(),
    };
    // Reassign (rather than push) so Sequelize detects the JSON change
    // and includes it in the UPDATE. Mutating an array in place doesn't
    // mark the field as changed.
    this.activityLog = [...(this.activityLog || []), entry];
    return this.save();
  };

  Bid.prototype.addComment = function addComment(text, user, isInternal = true) {
    const entry = {
      text,
      commentedBy: user?.id ?? user?._id ?? null,
      commentedByName: user?.name ?? "",
      commentedByRole: user?.role ?? "",
      isInternal,
      timestamp: new Date().toISOString(),
    };
    this.comments = [...(this.comments || []), entry];
    return this.save();
  };

  /**
   * Recompute where this bid ranks against its tender's other active
   * bids. Excludes draft/withdrawn/rejected — matches the Mongoose
   * implementation.
   */
  Bid.prototype.calculateCompetitiveness = async function calculateCompetitiveness() {
    const excluded = ["draft", "withdrawn", "rejected"];
    const allBids = await Bid.findAll({
      where: {
        tenderId: this.tenderId,
        status: STATUSES.filter((s) => !excluded.includes(s)),
      },
      order: [["bidAmount", "ASC"]],
      attributes: ["id", "bidAmount"],
    });
    if (allBids.length === 0) return this;

    const lowest = Number(allBids[0].bidAmount);
    const avg =
      allBids.reduce((sum, b) => sum + Number(b.bidAmount), 0) / allBids.length;
    const mine = Number(this.bidAmount);

    this.isLowestBid = mine === lowest;
    const idx = allBids.findIndex((b) => String(b.id) === String(this.id));
    this.ranking = idx === -1 ? null : idx + 1;

    const pctFromAvg = ((mine - avg) / avg) * 100;
    if (pctFromAvg <= -15) this.priceCompetitiveness = "highly_competitive";
    else if (pctFromAvg <= -5) this.priceCompetitiveness = "competitive";
    else if (pctFromAvg <= 5) this.priceCompetitiveness = "average";
    else if (pctFromAvg <= 15) this.priceCompetitiveness = "above_average";
    else this.priceCompetitiveness = "expensive";

    return this.save();
  };

  Bid.associate = (models) => {
    Bid.belongsTo(models.Tender, { foreignKey: "tenderId", as: "tender" });
    Bid.belongsTo(models.User, { foreignKey: "vendorId", as: "vendor" });
    Bid.belongsTo(models.User, { foreignKey: "evaluatedBy", as: "evaluator" });
  };

  Bid.CURRENCIES = CURRENCIES;
  Bid.STATUSES = STATUSES;
  Bid.RISK_LEVELS = RISK_LEVELS;
  Bid.COMPETITIVENESS_LEVELS = COMPETITIVENESS_LEVELS;
  Bid.SCORE_WEIGHTS = SCORE_WEIGHTS;
  Bid.COUNTABLE_STATUSES = COUNTABLE_STATUSES;

  return Bid;
};
