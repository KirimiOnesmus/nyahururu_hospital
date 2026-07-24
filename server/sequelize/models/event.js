"use strict";

module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    "Event",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: DataTypes.TEXT,
      date: DataTypes.DATE,
      location: DataTypes.STRING(255),
      imageUrl: DataTypes.STRING(500),
    },
    {
      tableName: "events",
      indexes: [{ fields: ["date"] }],
    },
  );

  return Event;
};
