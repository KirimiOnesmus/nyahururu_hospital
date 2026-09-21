"use strict";

const { CLOSURE_REASONS } = require("../../constants/researchIndex");

const CLOSURE_REASON_VALUES = Object.values(CLOSURE_REASONS);

/**
 * Study-closure payload for a submission.
 *
 * A closure is stored as its own row in `submissions`
 * (submission_type = 'study_closure') carrying the shared review lifecycle.
 * The closeout report and disposal/attestation data live here, one row per
 * submission, replacing the `closure_report` JSON blob and the loose
 * closeout columns on the base table.
 */
module.exports = (sequelize, DataTypes) => {
  const ClosureDetail = sequelize.define(
    "ClosureDetail",
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

      closureReason: {
        type: DataTypes.ENUM(...CLOSURE_REASON_VALUES),
        allowNull: false,
      },

      resultsSummary: DataTypes.TEXT,
      publications: DataTypes.TEXT,
      participantIdentifiersDestroyed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      specimenDisposalPlan: DataTypes.TEXT,
      dataFutureUsePlan: DataTypes.TEXT,
      investigationalProductDisposal: DataTypes.TEXT,

      closeoutReportFile: { type: DataTypes.STRING(500), allowNull: true },
      closeoutReportFileKey: { type: DataTypes.STRING(255), allowNull: true },
      publicationLink: { type: DataTypes.STRING(500), allowNull: true },

      submittedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "closure_details",
      indexes: [{ unique: true, fields: ["submission_id"] }],
    },
  );

  ClosureDetail.associate = (models) => {
    if (models.Research) {
      ClosureDetail.belongsTo(models.Research, {
        foreignKey: "submissionId",
        as: "submission",
      });
    }
  };

  return ClosureDetail;
};
