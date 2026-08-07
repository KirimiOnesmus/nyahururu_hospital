"use strict";

module.exports = (sequelize, DataTypes) => {
  const CoInvestigatorAssignment = sequelize.define(
    "CoInvestigatorAssignment",
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
      },
      researcherId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "researchers", key: "id" },
      },
      invitedById: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
      },
      roleOnStudy: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      canEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      acceptedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "co_investigator_assignments",
      indexes: [
        { unique: true, fields: ["research_id", "researcher_id"], name: "uq_coinv_research_researcher" },
        { fields: ["researcher_id"], name: "idx_coinv_researcher" },
      ],
    },
  );

  CoInvestigatorAssignment.associate = (models) => {
    CoInvestigatorAssignment.belongsTo(models.Research, {
      foreignKey: "researchId",
      as: "research",
    });
    CoInvestigatorAssignment.belongsTo(models.Researcher, {
      foreignKey: "researcherId",
      as: "coInvestigator",
    });
    CoInvestigatorAssignment.belongsTo(models.Researcher, {
      foreignKey: "invitedById",
      as: "invitedBy",
    });
  };

  // ── Query helpers ──

  CoInvestigatorAssignment.getForResearch = function getForResearch(researchId) {
    return CoInvestigatorAssignment.findAll({
      where: { researchId },
      include: [{
        model: sequelize.models.Researcher,
        as: "coInvestigator",
        attributes: ["id", "name", "firstName", "lastName", "email", "institution", "department"],
      }],
    });
  };

  CoInvestigatorAssignment.isCoInvestigator = async function isCoInvestigator(researchId, researcherId) {
    const count = await CoInvestigatorAssignment.count({
      where: { researchId, researcherId },
    });
    return count > 0;
  };

  CoInvestigatorAssignment.getStudiesForResearcher = function getStudiesForResearcher(researcherId) {
    return CoInvestigatorAssignment.findAll({
      where: { researcherId },
      attributes: ["researchId", "roleOnStudy", "canEdit", "acceptedAt", "createdAt"],
    });
  };

  return CoInvestigatorAssignment;
};
