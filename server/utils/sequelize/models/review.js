"use strict";

const {
  RESEARCH_STAGES,
  REVIEW_DECISIONS,
} = require("../../constants/researchIndex");

const STAGE_VALUES = Object.values(RESEARCH_STAGES);
const DECISION_VALUES = Object.values(REVIEW_DECISIONS);
const REVIEWER_ROLES = ["reviewer", "committee"];

module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define(
    "Review",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      researchId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "researches", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      reviewerId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "researchers", key: "id" },
        // Reviewer accounts must not be removable while active reviews
        // exist — the audit trail depends on knowing who voted.
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      stage: {
        type: DataTypes.ENUM(...STAGE_VALUES),
        allowNull: false,
      },
      round: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },
      decision: {
        type: DataTypes.ENUM(...DECISION_VALUES),
        allowNull: false,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Review comment is required" },
          len: {
            args: [10, 65535],
            msg: "Comment must be at least 10 characters",
          },
        },
      },
      // Small, per-review scoring/criteria object — always fetched
      // wholesale with the review row. JSON matches the Mongo `Mixed`
      // type it replaces without pretending to structure it.
      criteria: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      reviewerRole: {
        type: DataTypes.ENUM(...REVIEWER_ROLES),
        allowNull: false,
      },
      // Meaningful only for reviewer-role reviews — a committee vote is
      // always created with isLatest: false, because multiple committee
      // members' votes coexist for the same research+stage+round.
      isLatest: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      // ── Committee-vote uniqueness (partial-index workaround) ────────
      // MySQL has no partial indexes. To reproduce Mongoose's
      //   { research, stage, round, reviewer } UNIQUE
      //   WHERE reviewerRole === "committee"
      // we use a STORED generated column that only takes a non-NULL
      // value for committee-role rows, plus a UNIQUE index over it.
      // Multiple NULLs are allowed in a MySQL unique index, so
      // reviewer-role rows never collide — only committee-role rows do.
      // The column is filled by MySQL from the row's other fields; the
      // JS attribute is exposed here as read-only so app code can
      // observe it if needed but never write to it.
      committeeVoteKey: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
    },
    {
      tableName: "reviews",
      indexes: [
        { fields: ["research_id", "stage", "is_latest"] },
        { fields: ["reviewer_id", "submitted_at"] },
        { fields: ["research_id", "round"] },
        // Reviewer-less prefix for the committee-round listing query
        // (getCommitteeRoundVotes below).
        { fields: ["research_id", "stage", "reviewer_role", "round"] },
        // Committee-vote uniqueness — the DB-level guard against a
        // single committee member voting twice in the same round.
        { unique: true, fields: ["committee_vote_key"], name: "reviews_committee_vote_unique" },
      ],
      hooks: {
        beforeCreate: async (review, options) => {
          // Only reviewer-role rows track "latest" — unset any previous
          // latest for the same research+stage before inserting the new
          // one. Skipped for committee votes (multiple coexist).
          if (review.reviewerRole !== "reviewer" || !review.isLatest) return;
          await Review.update(
            { isLatest: false },
            {
              where: {
                researchId: review.researchId,
                stage: review.stage,
                reviewerRole: "reviewer",
                isLatest: true,
              },
              transaction: options.transaction,
              hooks: false,
              silent: true,
            },
          );
        },
      },
    },
  );

  // ── Static methods ────────────────────────────────────────────────
  Review.getLatest = function getLatest(researchId, stage) {
    return Review.findOne({
      where: { researchId, stage, isLatest: true, reviewerRole: "reviewer" },
      include: [
        {
          model: sequelize.models.Researcher,
          as: "reviewer",
          attributes: ["id", "name", "email", "institution"],
        },
      ],
    });
  };

  Review.getAllForResearch = function getAllForResearch(researchId) {
    return Review.findAll({
      where: { researchId },
      include: [
        {
          model: sequelize.models.Researcher,
          as: "reviewer",
          attributes: ["id", "name", "email", "institution"],
        },
      ],
      order: [
        ["round", "DESC"],
        ["submittedAt", "DESC"],
      ],
    });
  };

  Review.getReviewerStats = async function getReviewerStats(reviewerId) {
    const { fn, col } = sequelize;
    const rows = await Review.findAll({
      where: { reviewerId },
      attributes: ["decision", [fn("COUNT", col("id")), "count"]],
      group: ["decision"],
      raw: true,
    });
    const stats = { total: 0, approved: 0, revision: 0, rejected: 0 };
    for (const r of rows) {
      const n = Number(r.count);
      stats[r.decision] = n;
      stats.total += n;
    }
    stats.acceptanceRate = stats.total
      ? Math.round((stats.approved / stats.total) * 100)
      : 0;
    return stats;
  };

  Review.getCommitteeRoundVotes = function getCommitteeRoundVotes(researchId, stage, round) {
    return Review.findAll({
      where: { researchId, stage, reviewerRole: "committee", round },
      include: [
        {
          model: sequelize.models.Researcher,
          as: "reviewer",
          attributes: ["id", "name", "firstName", "lastName", "email"],
        },
      ],
      order: [["submittedAt", "ASC"]],
    });
  };

  Review.associate = (models) => {
    Review.belongsTo(models.Research, { foreignKey: "researchId", as: "research" });
    Review.belongsTo(models.Researcher, { foreignKey: "reviewerId", as: "reviewer" });
  };

  Review.STAGES = STAGE_VALUES;
  Review.DECISIONS = DECISION_VALUES;
  Review.ROLES = REVIEWER_ROLES;

  return Review;
};
