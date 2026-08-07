"use strict";

const {
  REVIEW_DECISIONS,
} = require("../../constants/researchIndex");


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
        references: { model: "submissions", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      reviewerId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "researchers", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
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

      criteria: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
        get() {
          const raw = this.getDataValue("criteria");
          if (!raw) return {};
          if (typeof raw === "string") {
            try { return JSON.parse(raw); } catch { return {}; }
          }
          return raw;
        },
      },
      reviewerRole: {
        type: DataTypes.ENUM(...REVIEWER_ROLES),
        allowNull: false,
      },
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

      committeeVoteKey: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      stage: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      // Chair's change #6: reviewers/committee members can attach
      // documents alongside their comment. Same visibility rule as the
      // comment itself — never surfaced directly to the researcher.
      attachments: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        get() {
          const raw = this.getDataValue("attachments");
          if (!raw) return [];
          if (typeof raw === "string") {
            try { return JSON.parse(raw); } catch { return []; }
          }
          return raw;
        },
      },
    },
    {
      tableName: "reviews",
      indexes: [
        { fields: ["research_id", "stage", "is_latest"] },
        { fields: ["reviewer_id", "submitted_at"] },
        { fields: ["research_id", "round"] },
        { fields: ["research_id", "stage", "reviewer_role", "round"] },
        { unique: true, fields: ["committee_vote_key"], name: "reviews_committee_vote_unique" },
      ],
      hooks: {
        beforeCreate: async (review, options) => {
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

  Review.DECISIONS = DECISION_VALUES;
  Review.ROLES = REVIEWER_ROLES;

  return Review;
};