"use strict";

module.exports = (sequelize, DataTypes) => {
  const News = sequelize.define(
    "News",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { notEmpty: true },
      },
      // Article body — TEXT, not STRING(255), so real posts don't get
      // silently truncated after cutover.
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      author: DataTypes.STRING(150),
      imageUrl: DataTypes.STRING(500),
    },
    {
      tableName: "news",
      indexes: [{ fields: ["created_at"] }],
    },
  );

  return News;
};
