"use strict";

module.exports = (sequelize, DataTypes) => {
  const TokenBlacklist = sequelize.define(
    "TokenBlacklist",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      jti: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "token_blacklist",
      updatedAt: false, // append-only; rows are never modified after insert
      indexes: [
        { unique: true, fields: ["jti"] },
        // MySQL has no native TTL/expireAfterSeconds index like MongoDB.
        // This index makes the periodic cleanup query (DELETE WHERE
        // expires_at < NOW()) efficient — see sequelize/README.md for the
        // scheduled-job note replacing Mongo's automatic TTL expiry.
        { fields: ["expires_at"] },
      ],
    },
  );

  return TokenBlacklist;
};
