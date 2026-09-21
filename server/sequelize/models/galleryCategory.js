"use strict";

module.exports = (sequelize, DataTypes) => {
  const GalleryCategory = sequelize.define(
    "GalleryCategory",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true },
      },
      description: DataTypes.STRING(500),
      icon: DataTypes.STRING(100),
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "gallery_categories",
      indexes: [
        { unique: true, fields: ["name"] },
        { fields: ["active"] },
        { fields: ["order"] },
      ],
    },
  );

  GalleryCategory.associate = (models) => {
    GalleryCategory.belongsTo(models.User, { foreignKey: "createdBy", as: "creator" });
  };

  return GalleryCategory;
};
