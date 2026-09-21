"use strict";

const GALLERY_TYPES = ["image", "video"];

module.exports = (sequelize, DataTypes) => {
  const Gallery = sequelize.define(
    "Gallery",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: DataTypes.TEXT,
      type: {
        type: DataTypes.ENUM(...GALLERY_TYPES),
        allowNull: false,
      },
      // The original Mongoose model stores `category` as a free-form
      // string, not a ref to GalleryCategory — kept the same here to
      // avoid silently changing the domain contract. Tightening it into
      // a FK is a separate decision, not a migration-shape decision.
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      fileUrl: { type: DataTypes.STRING(500), allowNull: false },
      thumbnailUrl: DataTypes.STRING(500),
      fileName: { type: DataTypes.STRING(255), allowNull: false },
      fileSize: DataTypes.BIGINT.UNSIGNED, // bytes
      mimeType: DataTypes.STRING(100),

      // Free-form tag list; queried only for full-text search (see the
      // FULLTEXT index added in the matching migration). JSON is fine.
      tags: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },

      visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      views: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      likes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },

      uploadedBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      // Denormalized upload timestamp — Mongoose model kept it separate
      // from createdAt (they can drift if items are re-imported), so
      // preserved here.
      uploadDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "gallery",
      indexes: [
        { fields: ["category"] },
        { fields: ["type"] },
        { fields: ["visible"] },
        { fields: ["upload_date"] },
      ],
    },
  );

  Gallery.associate = (models) => {
    Gallery.belongsTo(models.User, { foreignKey: "uploadedBy", as: "uploader" });
  };

  Gallery.TYPES = GALLERY_TYPES;

  return Gallery;
};
