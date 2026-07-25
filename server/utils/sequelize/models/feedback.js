"use strict";

module.exports = (sequelize, DataTypes) => {
  const Feedback = sequelize.define(
    "Feedback",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      // Both are optional — the feedback form accepts anonymous
      // submissions where only `message` is required.
      name: {
        type: DataTypes.STRING(150),
        allowNull: true,
        set(value) {
          this.setDataValue("name", value ? value.trim() : value);
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmailIfPresent(value) {
            if (value && !/^\S+@\S+\.\S+$/.test(value)) {
              throw new Error("Invalid email address");
            }
          },
        },
        set(value) {
          this.setDataValue("email", value ? value.trim().toLowerCase() : value);
        },
      },
      // subject + type were written by feedbackController but never
      // declared on the Mongoose schema (silent-drop bug). Added as real
      // columns via migration 20260723100000; see that file for context.
      // Kept as STRINGs (not ENUMs) to match Mongoose's "accept anything"
      // contract; if the type set is later frozen, promote to ENUM.
      subject: {
        type: DataTypes.STRING(255),
        allowNull: true,
        set(value) {
          this.setDataValue("subject", value ? value.trim() : value);
        },
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: { msg: "Message is required" } },
      },
      // Kept as a free-form STRING rather than an ENUM to match the
      // Mongoose schema exactly — the original had no enum constraint,
      // so tightening to ENUM here would silently start rejecting
      // status values the controllers were previously free to write.
      // Callers today use "pending" and "responded"; if that becomes a
      // fixed set, promote to ENUM in a follow-up migration.
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "pending",
      },
      response: DataTypes.TEXT,
      respondedBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      respondedByName: DataTypes.STRING(150),
      respondedAt: DataTypes.DATE,
      // Manual createdAt column — the Mongoose schema explicitly
      // declared its own `createdAt` and did NOT enable `timestamps`,
      // so no updatedAt was ever tracked. Preserved so the DB row shape
      // stays a 1:1 match with what the controllers write today.
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "feedback",
      timestamps: false,
      indexes: [
        { fields: ["status"] },
        { fields: ["type"] },
        { fields: ["created_at"] },
        { fields: ["email"] },
      ],
    },
  );

  Feedback.associate = (models) => {
    Feedback.belongsTo(models.User, { foreignKey: "respondedBy", as: "responder" });
  };

  return Feedback;
};
