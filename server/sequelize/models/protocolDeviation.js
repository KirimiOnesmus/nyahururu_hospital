"use strict";

module.exports = (sequelize, DataTypes) => {
  const ProtocolDeviation = sequelize.define(
    "ProtocolDeviation",
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
      deviationType: {
        type: DataTypes.ENUM("protocol_deviation", "protocol_violation", "safety_event"),
        allowNull: false,
        defaultValue: "protocol_deviation",
      },
      severity: {
        type: DataTypes.ENUM("minor", "major", "critical"),
        allowNull: false,
        defaultValue: "minor",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      dateOfDeviation: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      correctiveAction: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      participantsAffected: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: 0,
      },
      atRiskParticipantList: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isUrgentSafety: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      linkedAmendmentId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "submissions", key: "id" },
      },
      status: {
        type: DataTypes.ENUM("draft", "submitted", "acknowledged", "resolved"),
        allowNull: false,
        defaultValue: "draft",
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      supportingDocuments: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      tableName: "protocol_deviations",
      indexes: [
        { fields: ["research_id"], name: "idx_deviation_research" },
        { fields: ["researcher_id"], name: "idx_deviation_researcher" },
        { fields: ["status", "deadline"], name: "idx_deviation_status_deadline" },
      ],
    },
  );

  ProtocolDeviation.associate = (models) => {
    ProtocolDeviation.belongsTo(models.Research, {
      foreignKey: "researchId",
      as: "research",
    });
    ProtocolDeviation.belongsTo(models.Researcher, {
      foreignKey: "researcherId",
      as: "researcher",
    });
    ProtocolDeviation.belongsTo(models.Research, {
      foreignKey: "linkedAmendmentId",
      as: "linkedAmendment",
    });
  };

  // Query helpers
  ProtocolDeviation.getForResearch = function getForResearch(researchId) {
    return ProtocolDeviation.findAll({
      where: { researchId },
      include: [{
        model: sequelize.models.Researcher,
        as: "researcher",
        attributes: ["id", "name", "email"],
      }],
      order: [["createdAt", "DESC"]],
    });
  };

  ProtocolDeviation.getOverdue = function getOverdue() {
    const { Op } = sequelize.Sequelize;
    return ProtocolDeviation.findAll({
      where: {
        status: { [Op.in]: ["draft", "submitted"] },
        deadline: { [Op.lt]: new Date() },
      },
      include: [
        { model: sequelize.models.Research, as: "research", attributes: ["id", "title", "researchId", "seruNumber"] },
        { model: sequelize.models.Researcher, as: "researcher", attributes: ["id", "name", "email"] },
      ],
    });
  };

  return ProtocolDeviation;
};
