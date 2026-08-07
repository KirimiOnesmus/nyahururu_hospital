"use strict";

const { Op } = require("sequelize");
const {
  REVIEWER_ASSIGNMENT_STATUS,
} = require("../../constants/researchIndex");

const STATUS_VALUES = Object.values(REVIEWER_ASSIGNMENT_STATUS);

module.exports = (sequelize, DataTypes) => {
  const ResearchReviewer = sequelize.define(
    "ResearchReviewer",
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
      assignedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      assignedById: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      reviewStatus: {
        type: DataTypes.ENUM(...STATUS_VALUES),
        allowNull: false,
        defaultValue: REVIEWER_ASSIGNMENT_STATUS.PENDING,
      },

      reviewId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "reviews", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },

      // Chair's change #9: idempotency guard for the 7-day reminder job
      // — makes the job safe to re-run without double-sending.
      firstReminderSentAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "research_reviewers",
      indexes: [
        { unique: true, fields: ["research_id", "reviewer_id"], name: "research_reviewers_unique" },
        { fields: ["reviewer_id", "review_status"], name: "research_reviewers_reviewer_status" },
      ],
    },
  );

  //  Static helpers 

  ResearchReviewer.getForResearch = function getForResearch(researchId) {
    return ResearchReviewer.findAll({
      where: { researchId },
      include: [
        {
          model: sequelize.models.Researcher,
          as: "reviewer",
          attributes: ["id", "name", "firstName", "lastName", "email", "institution", "specialisations"],
        },
      ],
      order: [["assignedAt", "ASC"]],
    });
  };


  ResearchReviewer.checkAllSubmitted = async function checkAllSubmitted(researchId) {
    const assignments = await ResearchReviewer.findAll({
      where: { researchId },
      attributes: ["reviewStatus"],
      raw: true,
    });

    const total = assignments.length;
    const submitted = assignments.filter(
      (a) => a.reviewStatus === REVIEWER_ASSIGNMENT_STATUS.SUBMITTED,
    ).length;

    return {
      allSubmitted: total > 0 && submitted === total,
      total,
      submitted,
      pending: total - submitted,
    };
  };


  ResearchReviewer.getAssignedResearchIds = async function getAssignedResearchIds(
    reviewerId,
    { statusFilter } = {},
  ) {
    const where = { reviewerId };
    if (statusFilter) where.reviewStatus = statusFilter;

    const rows = await ResearchReviewer.findAll({
      where,
      attributes: ["researchId"],
      raw: true,
    });
    return rows.map((r) => r.researchId);
  };


  ResearchReviewer.isAssigned = async function isAssigned(researchId, reviewerId) {
    const row = await ResearchReviewer.findOne({
      where: { researchId, reviewerId },
      attributes: ["id"],
    });
    return !!row;
  };

  // Chair's change #9: rows still pending review, assigned at least
  // `days` ago, that have never had a reminder sent.
  ResearchReviewer.findDueForReminder = async function findDueForReminder(days) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return ResearchReviewer.findAll({
      where: {
        reviewStatus: REVIEWER_ASSIGNMENT_STATUS.PENDING,
        assignedAt: { [Op.lte]: cutoff },
        firstReminderSentAt: null,
      },
      include: [
        {
          model: sequelize.models.Researcher,
          as: "reviewer",
          attributes: ["id", "name", "firstName", "email"],
        },
        {
          model: sequelize.models.Research,
          as: "research",
          attributes: ["id", "title", "submissionType", "reviewDeadline"],
        },
      ],
    });
  };

  //  Associations 

  ResearchReviewer.associate = (models) => {
    ResearchReviewer.belongsTo(models.Research, {
      foreignKey: "researchId",
      as: "research",
    });
    ResearchReviewer.belongsTo(models.Researcher, {
      foreignKey: "reviewerId",
      as: "reviewer",
    });
    ResearchReviewer.belongsTo(models.Researcher, {
      foreignKey: "assignedById",
      as: "assignedBy",
    });
    if (models.Review) {
      ResearchReviewer.belongsTo(models.Review, {
        foreignKey: "reviewId",
        as: "review",
      });
    }
  };

  ResearchReviewer.STATUSES = STATUS_VALUES;

  return ResearchReviewer;
};