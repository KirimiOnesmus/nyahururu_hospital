"use strict";

// The Compiled Decision Report is the single artifact a researcher is
// ever allowed to see about their review outcome. It is auto-drafted
// the moment the committee reaches quorum (reviewer identity already
// stripped at that point — see researchService.submitCommitteeReview),
// stays invisible to the researcher until the Research Officer calls
// the release endpoint, and after release is the only source the
// researcher-facing decision-report endpoint reads from.
//
// See Chair_s_Changes.docx §5, §6.1, §6.8.

const DECISION_VALUES = ["approved", "revision", "rejected", "suspended"];

module.exports = (sequelize, DataTypes) => {
  const ResearchDecisionReport = sequelize.define(
    "ResearchDecisionReport",
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
      round: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
      // [{ comment, criteria, decision, submittedAt }] — no reviewerId,
      // name, or email. Stripped before storage; never re-hydrated with
      // identity later, so there is no code path that can leak it to a
      // researcher/co-investigator caller by accident.
      reviewerComments: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        get() {
          const raw = this.getDataValue("reviewerComments");
          if (!raw) return [];
          if (typeof raw === "string") {
            try { return JSON.parse(raw); } catch { return []; }
          }
          return raw;
        },
      },
      // Editable by the Research Officer before release.
      committeeComment: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
      },
      // Officer-uploaded file (PDF/document) to merge into the letter
      officerAttachment: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      // Pre-filled from the committee's vote; RO may override before
      // release.
      finalDecision: {
        type: DataTypes.ENUM(...DECISION_VALUES),
        allowNull: true,
      },
      compiledById: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      decisionLetterId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      releasedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "research_decision_reports",
      indexes: [
        { unique: true, fields: ["research_id", "round"], name: "research_decision_reports_research_round_unique" },
        { fields: ["released_at"], name: "research_decision_reports_released_idx" },
      ],
    },
  );

  Object.defineProperty(ResearchDecisionReport.prototype, "isReleased", {
    get() {
      return !!this.releasedAt;
    },
  });

  ResearchDecisionReport.getLatestForResearch = function getLatestForResearch(researchId) {
    return ResearchDecisionReport.findOne({
      where: { researchId },
      order: [["round", "DESC"]],
    });
  };

  // The one researcher-facing read. Returns null (→ 404/empty at the
  // controller) until released_at is set — there is no partial view.
  ResearchDecisionReport.getReleasedForResearch = async function getReleasedForResearch(researchId) {
    const report = await ResearchDecisionReport.getLatestForResearch(researchId);
    if (!report || !report.releasedAt) return null;
    return report;
  };

  ResearchDecisionReport.associate = (models) => {
    ResearchDecisionReport.belongsTo(models.Research, {
      foreignKey: "researchId",
      as: "research",
    });
    ResearchDecisionReport.belongsTo(models.User, {
      foreignKey: "compiledById",
      as: "compiledBy",
    });
  };

  ResearchDecisionReport.DECISIONS = DECISION_VALUES;

  return ResearchDecisionReport;
};
