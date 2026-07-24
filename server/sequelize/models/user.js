"use strict";

const bcrypt = require("bcryptjs");
const { BCRYPT_SALT_ROUNDS } = require("../../constants/authConfig");

// Mirrors the enum in models/userModel.js exactly, so existing controller
// logic that checks `role` values keeps working unchanged after cutover.
const USER_ROLES = [
  "superadmin",
  "admin",
  "doctor",
  "staff",
  "it",
  "nurse",
  "pharmacist",
  "communication",
  "research",
];

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: { notEmpty: true },
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: { notEmpty: true },
      },
      // Kept denormalized (firstName + lastName) for compatibility with
      // existing frontend/controller code that reads `user.name` directly.
      name: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        set(value) {
          this.setDataValue("email", value ? value.trim().toLowerCase() : value);
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // Tokens are stored hashed by the controllers (never raw), but we
      // still exclude them from default SELECTs to match the Mongoose
      // `select: false` behavior and reduce accidental exposure.
      emailVerificationToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      emailVerificationExpire: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      passwordResetToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      passwordResetExpire: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM(...USER_ROLES),
        allowNull: false,
        defaultValue: "staff",
      },
      department: DataTypes.STRING(100),
      position: DataTypes.STRING(100),
      phone: DataTypes.STRING(30),
      bloodGroup: DataTypes.STRING(10),
      expiryDate: DataTypes.DATE,
      signatureText: DataTypes.STRING(255),
      dateOfBirth: DataTypes.DATEONLY,
      joinDate: DataTypes.DATEONLY,
      photo: DataTypes.STRING(500),
      terms: DataTypes.STRING(255),
      signature: DataTypes.STRING(500),
      employeeId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },
      rfidTag: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
      },
      // Referenced by authController.js / userController.js today
      // (account-lockout logic) but never existed as real, persisted
      // columns on the old Mongoose schema — writes to them were silently
      // dropped on save() under Mongoose's default strict mode. Adding
      // them as real columns here fixes that latent bug as part of the
      // migration rather than carrying it forward.
      failedLoginAttempts: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      lockUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Added alongside failedLoginAttempts/lockUntil — see migration
      // 20260723090000. Forces a password change after a system-issued
      // temp password (account creation, email verification).
      mustChangePassword: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      // Account deactivation flag, checked on login and by
      // verifyToken/refresh. See migration 20260723090000.
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "users",
      defaultScope: {
        attributes: {
          exclude: [
            "emailVerificationToken",
            "emailVerificationExpire",
            "passwordResetToken",
            "passwordResetExpire",
          ],
        },
      },
      scopes: {
        // Explicit opt-in scope for the auth flows that actually need the
        // token columns (mirrors Mongoose's `.select("+passwordResetToken")`).
        withSecrets: {
          attributes: { include: [
            "emailVerificationToken",
            "emailVerificationExpire",
            "passwordResetToken",
            "passwordResetExpire",
          ] },
        },
      },
      indexes: [
        { unique: true, fields: ["email"] },
        { unique: true, fields: ["employee_id"] },
        { unique: true, fields: ["rfid_tag"] },
        { fields: ["role"] },
      ],
      hooks: {
        beforeSave: async (user) => {
          if (user.changed("password") && user.password) {
            user.password = await bcrypt.hash(user.password, BCRYPT_SALT_ROUNDS);
          }
          if (user.changed("firstName") || user.changed("lastName")) {
            user.name = `${user.firstName} ${user.lastName}`.trim();
          }
        },
      },
    },
  );

  User.prototype.matchPassword = async function matchPassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  };

  User.associate = (models) => {
    User.hasOne(models.Profile, { foreignKey: "userId", as: "profile", onDelete: "CASCADE" });
  };

  User.ROLES = USER_ROLES;

  return User;
};
