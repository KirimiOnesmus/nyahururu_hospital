"use strict";

const REPORT_CATEGORIES = [
  "operations",
  "financial",
  "inventory",
  "logistics",
  "hr",
  "procurement",
];
const REPORT_TYPES = ["pdf", "excel", "word", "zip", "image"];
const REPORT_PERIODS = ["Monthly", "Quarterly", "Yearly", "Custom"];
const REPORT_STATUSES = ["draft", "published", "archived"];

module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define(
    "Report",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(300),
        allowNull: false,
        validate: { notEmpty: { msg: "Report title is required" } },
        set(value) {
          this.setDataValue("title", value ? value.trim() : value);
        },
      },
      category: {
        type: DataTypes.ENUM(...REPORT_CATEGORIES),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(...REPORT_TYPES),
        allowNull: false,
      },
      period: {
        type: DataTypes.ENUM(...REPORT_PERIODS),
        allowNull: false,
      },
      customStartDate: DataTypes.DATE,
      customEndDate: DataTypes.DATE,
      description: {
        type: DataTypes.TEXT,
        set(value) {
          this.setDataValue("description", value ? value.trim() : value);
        },
      },
      fileUrl: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      // Bytes — files can plausibly exceed the ~2GB INT limit for image
      // bundles or ZIP archives, so BIGINT.
      fileSize: DataTypes.BIGINT.UNSIGNED,
      status: {
        type: DataTypes.ENUM(...REPORT_STATUSES),
        allowNull: false,
        defaultValue: "draft",
      },
      uploadedBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        // A report row should not disappear if the uploader's account
        // is later removed — reports are institutional artifacts, not
        // personal ones. Prefer RESTRICT so the deletion has to be
        // handled deliberately.
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      views: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      downloads: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      // JSON — same pattern as Bid.tags/comments. Never queried across
      // reports; only ever fetched wholesale with the parent row.
      tags: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      comments: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      tableName: "reports",
      indexes: [
        { fields: ["category", "status"] },
        { fields: ["uploaded_by"] },
        { fields: ["type"] },
        { fields: ["period"] },
      ],
      validate: {
        // Cross-field: when period === "Custom", both custom dates must
        // be provided, and start must be on/before end. The Mongoose
        // schema had no such check — controllers relied on ad-hoc
        // validation. Making this a model-level invariant catches bad
        // payloads before they land in a report list.
        customPeriodHasDates() {
          if (this.period === "Custom") {
            if (!this.customStartDate || !this.customEndDate) {
              throw new Error(
                "customStartDate and customEndDate are required when period is Custom",
              );
            }
            if (new Date(this.customStartDate) > new Date(this.customEndDate)) {
              throw new Error("customStartDate must be on or before customEndDate");
            }
          }
        },
      },
    },
  );

  // Same JSON-mutation pattern used by Bid: reassign rather than push,
  // so Sequelize's change tracker actually detects the edit.
  Report.prototype.addComment = function addComment(text, user) {
    const entry = {
      text,
      commentedBy: user?.id ?? user?._id ?? null,
      commentedByName: user?.name ?? "",
      createdAt: new Date().toISOString(),
    };
    this.comments = [...(this.comments || []), entry];
    return this.save();
  };

  Report.associate = (models) => {
    Report.belongsTo(models.User, { foreignKey: "uploadedBy", as: "uploader" });
  };

  Report.CATEGORIES = REPORT_CATEGORIES;
  Report.TYPES = REPORT_TYPES;
  Report.PERIODS = REPORT_PERIODS;
  Report.STATUSES = REPORT_STATUSES;

  return Report;
};
