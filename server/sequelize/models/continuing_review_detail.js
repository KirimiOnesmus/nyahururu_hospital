"use strict";

/**
 * Continuing-review (SERU Type B) payload for a submission.
 *
 * A continuing review is stored as its own row in `submissions`
 * (submission_type = 'continuing_review'), which carries the shared review
 * lifecycle. Everything specific to the progress report lives here, one row
 * per submission, so the base table no longer needs sparse NULL columns or a
 * `continuing_review_data` JSON blob.
 */
module.exports = (sequelize, DataTypes) => {
  const ContinuingReviewDetail = sequelize.define(
    "ContinuingReviewDetail",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      submissionId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true, // 1:1 with the submission
        references: { model: "submissions", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      progressSummary: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: { msg: "Progress summary is required" } },
      },
      participantsEnrolled: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      participantsContinuing: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      adverseEvents: DataTypes.TEXT,
      amendments: DataTypes.TEXT,
      constraints: DataTypes.TEXT,
      plansForNextYear: DataTypes.TEXT,
      isLastYear: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      // Mandatory supporting documents uploaded at this stage:
      // [{ label, url, key }]. At least one is enforced in the service.
      documents: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },

      submittedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "continuing_review_details",
      indexes: [{ unique: true, fields: ["submission_id"] }],
    },
  );

  ContinuingReviewDetail.associate = (models) => {
    if (models.Research) {
      ContinuingReviewDetail.belongsTo(models.Research, {
        foreignKey: "submissionId",
        as: "submission",
      });
    }
  };

  return ContinuingReviewDetail;
};
