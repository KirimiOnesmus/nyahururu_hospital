"use strict";

module.exports = (sequelize, DataTypes) => {
  const Profile = sequelize.define(
    "Profile",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      phone: DataTypes.STRING(30),
      address: DataTypes.STRING(255),
      imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: "profiles",
      indexes: [{ unique: true, fields: ["user_id"] }],
    },
  );

  Profile.associate = (models) => {
    Profile.belongsTo(models.User, { foreignKey: "userId", as: "user" });
  };

  return Profile;
};
