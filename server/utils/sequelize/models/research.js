"use strict";

const {
  RESEARCH_STAGES,
  RESEARCH_STATUSES,
  FEES,
} = require("../../constants/researchIndex");

const STAGE_VALUES = Object.values(RESEARCH_STAGES);
const STATUS_VALUES = Object.values(RESEARCH_STATUSES);

/**
 * Levenshtein distance. Kept identical to the Mongoose implementation
 * so title-similarity thresholds behave the same after cutover.
 */
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array(b.length).fill(0),
  ]);
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

module.exports = (sequelize, DataTypes) => {
  const Research = sequelize.define(
    "Research",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      researcherId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "researchers", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      // Public identifier `NCRH-{year}-{5digits}` — set via Counter in
      // the beforeValidate hook. Sparse-unique via MySQL default
      // multi-NULL semantics.
      researchId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },

      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: { notEmpty: { msg: "Title is required" } },
        set(value) {
          this.setDataValue("title", value ? value.trim() : value);
        },
      },
      discipline: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: { msg: "Discipline is required" } },
      },
      abstract: DataTypes.TEXT,
      background: DataTypes.TEXT,
      objectives: DataTypes.TEXT,
      methodology: DataTypes.TEXT,
      expectedOutcome: DataTypes.TEXT,
      timeline: DataTypes.TEXT,
      teamMembers: DataTypes.TEXT,
      references: DataTypes.TEXT,

      // Stage-1 ethics/funding fields — all optional TEXT.
      hypotheses: DataTypes.TEXT,
      literatureReviewSummary: DataTypes.TEXT,
      studyDuration: DataTypes.STRING(150),
      // Short string arrays — JSON, updated wholesale.
      studySites: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      coInvestigators: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      fundingSource: DataTypes.STRING(300),
      ethicsInformation: DataTypes.TEXT,

      // Stage-1 files
      proposalFile: DataTypes.STRING(500),
      proposalFileKey: DataTypes.STRING(255),

      // Stage-2 progress data — deeply nested single object, always
      // fetched wholesale. JSON is the right shape.
      progressData: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      progressFiles: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },

      priority: {
        type: DataTypes.ENUM("high", "medium", "normal"),
        allowNull: false,
        defaultValue: "normal",
      },
      reviewDeadline: DataTypes.DATE,

      // Stage-3 final paper
      finalPaperFile: DataTypes.STRING(500),
      finalPaperFileKey: DataTypes.STRING(255),
      finalAbstract: DataTypes.TEXT,
      keywords: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      finalPaperFiles: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      finalPaperSubmission: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },

      journalName: DataTypes.STRING(255),
      journalVolume: DataTypes.STRING(100),
      journalDoi: DataTypes.STRING(200),

      // Workflow
      stage: {
        type: DataTypes.ENUM(...STAGE_VALUES),
        allowNull: false,
        defaultValue: RESEARCH_STAGES.PROPOSAL,
      },
      status: {
        type: DataTypes.ENUM(...STATUS_VALUES),
        allowNull: false,
        defaultValue: RESEARCH_STATUSES.PENDING,
      },
      assignedReviewerId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      assignedAt: DataTypes.DATE,

      // ── Review snapshots (per-stage denormalized decisions) ────────
      // Kept as JSON, not join tables. Each snapshot is a
      // one-object-per-stage per Research and is always fetched
      // wholesale with the research row (Mongoose treated them the
      // same way — one subdocument per stage). Canonical, queryable
      // review history lives in the `reviews` table.
      proposalReview: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      progressReview: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      finalPaperReview: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },

      // Latest-decision denormalized fields — mirror the Mongoose
      // "whichever stage" convenience columns.
      reviewComment: DataTypes.TEXT,
      reviewedById: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      reviewedAt: DataTypes.DATE,

      resubmissionCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },

      // Circular FK to payments — column exists here, constraint added
      // in the follow-up migration (20260722150400).
      submissionPaymentId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      // Committee quorum voting
      committeeRound: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },
      committeeReviewedById: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      committeeReviewedAt: DataTypes.DATE,
      committeeComment: { type: DataTypes.TEXT, defaultValue: "" },

      reactivatedAt: DataTypes.DATE,
      reactivatedById: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      reactivationReason: DataTypes.STRING(500),

      aggregateScore: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
        validate: { min: 0, max: 10 },
      },
      reviewDecision: DataTypes.STRING(50),

      // NACOSTI
      nacostiPermit: DataTypes.STRING(100),
      nacostiSubmittedAt: DataTypes.DATE,

      // Certificates — circular FKs (added in follow-up migration).
      clearanceCertificateId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      completionCertificateId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      // Publishing
      isPublished: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      publishedAt: DataTypes.DATE,
      downloadPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: FEES.DEFAULT_DOWNLOAD,
        validate: { min: { args: [0], msg: "Download price cannot be negative" } },
      },
      downloads: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      views: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },

      // Soft delete
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deletedAt: DataTypes.DATE,
      deletedById: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "researches",
      // Automatic soft-delete filter — replaces the Mongoose
      // pre(/^find/) middleware. Callers who need deleted rows
      // (admin restore flow, hard-delete cleanup) use
      // `Research.unscoped()` or `.scope('withDeleted')`.
      defaultScope: {
        where: { isDeleted: false },
      },
      scopes: {
        withDeleted: {}, // no filter
        onlyDeleted: { where: { isDeleted: true } },
      },
      indexes: [
        { unique: true, fields: ["research_id"] },
        { fields: ["researcher_id", "created_at"] },
        { fields: ["stage", "status"] },
        { fields: ["is_published", "created_at"] },
        { fields: ["is_published", "discipline"] },
        { fields: ["assigned_reviewer_id", "status"] },
        { fields: ["is_deleted", "is_published"] },
        { fields: ["title"] },
        { fields: ["discipline"] },
      ],
      hooks: {
        beforeValidate: async (research, options) => {
          // Atomic per-year sequence via the Counter model — same
          // pattern used for Tender numbers. Only fires when
          // researchId isn't already set, matching Mongoose's
          // static generateResearchId call site.
          if (!research.researchId) {
            const year = new Date().getFullYear();
            const seq = await sequelize.models.Counter.incrementAndGet(
              `research-${year}`,
              { transaction: options.transaction },
            );
            research.researchId = `NCRH-${year}-${String(seq).padStart(5, "0")}`;
          }
        },
      },
    },
  );

  // ── Virtuals (workflow gates) ─────────────────────────────────────
  Object.defineProperty(Research.prototype, "canSubmitProgress", {
    get() {
      return (
        this.stage === RESEARCH_STAGES.PROPOSAL &&
        this.status === RESEARCH_STATUSES.APPROVED
      );
    },
  });
  Object.defineProperty(Research.prototype, "canSubmitFinalPaper", {
    get() {
      return (
        this.stage === RESEARCH_STAGES.PROGRESS &&
        this.status === RESEARCH_STATUSES.APPROVED
      );
    },
  });
  Object.defineProperty(Research.prototype, "isReadyToPublish", {
    get() {
      return (
        this.stage === RESEARCH_STAGES.FINAL_PAPER &&
        this.status === RESEARCH_STATUSES.APPROVED &&
        !this.isPublished
      );
    },
  });

  Research.prototype.softDelete = function softDelete(deletedByResearcherId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedById = deletedByResearcherId ?? null;
    return this.save();
  };

  /**
   * MySQL replacement for the Mongoose Research.findSimilarTitles static.
   * Combines FULLTEXT relevance search (top 5 candidates) with a
   * Levenshtein-ratio filter so we still surface fuzzy near-duplicates
   * that share tokens but differ in exact phrasing. The FULLTEXT
   * candidate pool is intentionally small — Levenshtein is O(n·m) per
   * pair, and we don't want to run it against every title in the DB.
   *
   * Note: unlike Mongoose's weighted text index (title>abstract>...),
   * MySQL FULLTEXT has no per-column weighting. The tradeoff is worth
   * it: FULLTEXT is fast and native. If title-vs-abstract ranking
   * matters, split into two separate MATCH clauses at call time.
   */
  Research.findSimilarTitles = async function findSimilarTitles(
    title,
    { excludeId, threshold = 0.85 } = {},
  ) {
    const [candidates] = await sequelize.query(
      `SELECT id, title,
              MATCH(title, abstract, final_abstract, discipline) AGAINST(:q IN NATURAL LANGUAGE MODE) AS score
       FROM researches
       WHERE is_deleted = false
         ${excludeId ? "AND id <> :excludeId" : ""}
         AND MATCH(title, abstract, final_abstract, discipline) AGAINST(:q IN NATURAL LANGUAGE MODE)
       ORDER BY score DESC
       LIMIT 5`,
      { replacements: { q: title, excludeId } },
    );

    const normalize = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const a = normalize(title);

    return candidates.filter((c) => {
      const b = normalize(c.title);
      const longer = Math.max(a.length, b.length) || 1;
      const distance = levenshtein(a, b);
      return 1 - distance / longer >= threshold;
    });
  };

  Research.associate = (models) => {
    Research.belongsTo(models.Researcher, { foreignKey: "researcherId", as: "researcher" });
    Research.belongsTo(models.Researcher, { foreignKey: "assignedReviewerId", as: "assignedReviewer" });
    Research.belongsTo(models.Researcher, { foreignKey: "reviewedById", as: "reviewer" });
    Research.belongsTo(models.Researcher, { foreignKey: "committeeReviewedById", as: "committeeReviewer" });
    Research.belongsTo(models.Researcher, { foreignKey: "reactivatedById", as: "reactivator" });
    Research.belongsTo(models.Researcher, { foreignKey: "deletedById", as: "deleter" });

    // Reviews / Payments — Research is the parent side of both.
    if (models.Review) {
      Research.hasMany(models.Review, { foreignKey: "researchId", as: "reviews" });
    }
    if (models.Payment) {
      Research.hasMany(models.Payment, { foreignKey: "researchId", as: "payments" });
      // Circular FK — constraints: false because the DB-level FK is
      // added in the follow-up migration.
      Research.belongsTo(models.Payment, {
        foreignKey: "submissionPaymentId",
        as: "submissionPayment",
        constraints: false,
      });
    }
    if (models.Certificate) {
      Research.belongsTo(models.Certificate, {
        foreignKey: "clearanceCertificateId",
        as: "clearanceCertificate",
        constraints: false,
      });
      Research.belongsTo(models.Certificate, {
        foreignKey: "completionCertificateId",
        as: "completionCertificate",
        constraints: false,
      });
    }
  };

  Research.STAGES = STAGE_VALUES;
  Research.STATUSES = STATUS_VALUES;

  return Research;
};
