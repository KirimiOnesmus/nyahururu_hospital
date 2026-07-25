"use strict";

const NOTICE_CATEGORIES = [
  "General",
  "Emergency",
  "Event",
  "System Update",
  "Policy",
  "Maintenance",
  "Health Advisory",
];

const NOTICE_AUDIENCES = [
  "All",
  "Staff",
  "Patients",
  "Doctors",
  "Nurses",
  "Public",
  "Specific Department",
];

const NOTICE_STATUSES = ["active", "scheduled", "expired", "hidden"];

/**
 * Derives the effective status from visibility + start/end windows.
 * Ported directly from the Mongoose pre-save hook so the status field
 * stays consistent with the same rules the controllers/UI already expect:
 *   hidden > scheduled > expired > active
 */
function deriveStatus(notice) {
  const now = new Date();
  if (notice.visible === false) return "hidden";
  if (notice.startDate && new Date(notice.startDate) > now) return "scheduled";
  if (notice.endDate && new Date(notice.endDate) < now) return "expired";
  return "active";
}

module.exports = (sequelize, DataTypes) => {
  const Notice = sequelize.define(
    "Notice",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },

      category: {
        type: DataTypes.ENUM(...NOTICE_CATEGORIES),
        allowNull: false,
      },
      audience: {
        type: DataTypes.ENUM(...NOTICE_AUDIENCES),
        allowNull: false,
      },

      startDate: { type: DataTypes.DATE, allowNull: false },
      // Times stored as short strings ("HH:MM"), same as the Mongoose
      // model — controllers pass them straight through.
      startTime: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "00:00" },
      endDate: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      endTime: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "23:59" },

      status: {
        type: DataTypes.ENUM(...NOTICE_STATUSES),
        allowNull: false,
        defaultValue: "active",
      },
      visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sendNotification: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

      // Small file-metadata array (fileName, fileUrl, uploadedAt). Never
      // queried relationally in the controllers — kept as JSON rather
      // than exploded into an `attachments` join table. If usage ever
      // grows to per-attachment analytics, promote it then.
      attachments: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },

      views: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },

      createdBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      updatedBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "notices",
      indexes: [
        { fields: ["category"] },
        { fields: ["audience"] },
        { fields: ["status"] },
        { fields: ["start_date"] },
      ],
      hooks: {
        beforeSave: (notice) => {
          notice.status = deriveStatus(notice);
        },
      },
    },
  );

  Notice.associate = (models) => {
    Notice.belongsTo(models.User, { foreignKey: "createdBy", as: "creator" });
    Notice.belongsTo(models.User, { foreignKey: "updatedBy", as: "updater" });
  };

  Notice.CATEGORIES = NOTICE_CATEGORIES;
  Notice.AUDIENCES = NOTICE_AUDIENCES;
  Notice.STATUSES = NOTICE_STATUSES;

  return Notice;
};
