"use strict";

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { BCRYPT_SALT_ROUNDS } = require("../../constants/authConfig");
const {
  RESEARCHER_ROLES,
  RESEARCHER_STATUSES,
  TOKEN_TTL,
} = require("../../constants/researchIndex");

const ROLE_VALUES = Object.values(RESEARCHER_ROLES);
const STATUS_VALUES = Object.values(RESEARCHER_STATUSES);

const SECRET_COLUMNS = [
  "password",
  "emailVerificationToken",
  "emailVerificationExpire",
  "passwordResetToken",
  "passwordResetExpire",
  "invitationToken",
  "invitationExpire",
];

module.exports = (sequelize, DataTypes) => {
  const Researcher = sequelize.define(
    "Researcher",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      firstName: { type: DataTypes.STRING(50), allowNull: false },
      lastName: { type: DataTypes.STRING(50), allowNull: false },
      name: { type: DataTypes.STRING(120), allowNull: true },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        set(value) {
          this.setDataValue("email", value ? value.trim().toLowerCase() : value);
        },
      },
      phone: { type: DataTypes.STRING(30), allowNull: true, defaultValue: "" },

      password: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: { len: { args: [8, 255], msg: "Password must be at least 8 characters" } },
      },

      role: {
        type: DataTypes.ENUM(...ROLE_VALUES),
        allowNull: false,
        defaultValue: RESEARCHER_ROLES.RESEARCHER,
      },
      status: {
        type: DataTypes.ENUM(...STATUS_VALUES),
        allowNull: false,
        defaultValue: RESEARCHER_STATUSES.ACTIVE,
      },

      emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      emailVerificationToken: DataTypes.STRING(255),
      emailVerificationExpire: DataTypes.DATE,

      passwordResetToken: DataTypes.STRING(255),
      passwordResetExpire: DataTypes.DATE,

      invitationToken: DataTypes.STRING(255),
      invitationExpire: DataTypes.DATE,
      invitedByAdminId: DataTypes.STRING(50),
      invitedByAdminName: DataTypes.STRING(150),
      invitedAt: DataTypes.DATE,
      invitationAcceptedAt: DataTypes.DATE,

      title: { type: DataTypes.STRING(50), defaultValue: "" },
      institution: { type: DataTypes.STRING(255), defaultValue: "" },
      department: { type: DataTypes.STRING(150), defaultValue: "" },
      discipline: { type: DataTypes.STRING(150), defaultValue: "" },
      qualification: { type: DataTypes.STRING(150), defaultValue: "" },
      bio: { type: DataTypes.STRING(1000), defaultValue: "" },
      location: { type: DataTypes.STRING(150), defaultValue: "" },

      // Small, non-relational nested objects/arrays: stored as native
      // MySQL JSON columns (5.7.8+) rather than exploded into join tables.
      // They are never used in WHERE/JOIN predicates elsewhere in the
      // codebase, so this keeps the shape close to the original document
      // without giving up transactional/relational guarantees on the
      // fields that actually need them (see MIGRATION_PLAN.md).
      socialLinks: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: { twitter: "", linkedin: "", website: "" },
      },
      profileImage: DataTypes.STRING(500),
      profileImageKey: DataTypes.STRING(255),

      specialisations: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      reviewCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      acceptanceRate: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0, max: 100 },
      },

      notifications: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          proposalApproved: true,
          proposalRejected: true,
          reviewComplete: true,
          newDownload: false,
          systemUpdates: true,
          weeklyDigest: false,
        },
      },

      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      deactivatedAt: DataTypes.DATE,
      lastLogin: DataTypes.DATE,
      isCommittee: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      committeeSince: DataTypes.DATE,
      promotedFromReviewer: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      tableName: "researchers",
      defaultScope: {
        attributes: { exclude: SECRET_COLUMNS },
      },
      scopes: {
        withSecrets: { attributes: { include: SECRET_COLUMNS } },
        withPassword: { attributes: { include: ["password"] } },
      },
      indexes: [
        { unique: true, fields: ["email"] },
        { fields: ["role", "specialisations"] },
        { fields: ["role", "status"] },
        { fields: ["role", "institution"] },
        { fields: ["role", "is_committee"] },
        // MySQL FULLTEXT index — replaces the Mongo text index used by
        // search endpoints. Requires InnoDB (MySQL 5.6+); created via
        // raw SQL in the migration since Sequelize's index API doesn't
        // expose the FULLTEXT type directly for MySQL.
      ],
      hooks: {
        beforeSave: async (researcher) => {
          if (researcher.changed("firstName") || researcher.changed("lastName")) {
            researcher.name = `${researcher.firstName} ${researcher.lastName}`.trim();
          }
          if (researcher.changed("password") && researcher.password) {
            researcher.password = await bcrypt.hash(researcher.password, BCRYPT_SALT_ROUNDS);
          }
        },
      },
    },
  );

  Researcher.prototype.matchPassword = async function matchPassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  };

  Researcher.prototype.generateToken = function generateToken(type, ttlHours) {
    const raw = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(raw).digest("hex");

    const map = {
      verification: {
        tokenField: "emailVerificationToken",
        expireField: "emailVerificationExpire",
        defaultTTL: TOKEN_TTL.EMAIL_VERIFICATION,
      },
      reset: {
        tokenField: "passwordResetToken",
        expireField: "passwordResetExpire",
        defaultTTL: TOKEN_TTL.PASSWORD_RESET,
      },
      invite: {
        tokenField: "emailVerificationToken",
        expireField: "emailVerificationExpire",
        defaultTTL: TOKEN_TTL.REVIEWER_INVITE,
      },
    };

    const { tokenField, expireField, defaultTTL } = map[type];
    const hours = ttlHours || defaultTTL;

    this.set(tokenField, hashed);
    this.set(expireField, new Date(Date.now() + hours * 60 * 60 * 1000));

    return raw;
  };

  Researcher.prototype.toSafeJSON = function toSafeJSON() {
    const obj = this.toJSON();
    SECRET_COLUMNS.forEach((col) => delete obj[col]);
    return obj;
  };

  Researcher.findByEmail = function findByEmail(email) {
    return Researcher.findOne({ where: { email: email.toLowerCase().trim() } });
  };

  Researcher.findActiveReviewers = function findActiveReviewers(specialisation) {
    const where = {
      role: RESEARCHER_ROLES.REVIEWER,
      status: RESEARCHER_STATUSES.ACTIVE,
      isActive: true,
    };
    // specialisations is a JSON array column; membership filtering is done
    // in the service layer post-fetch (or via JSON_CONTAINS in a raw
    // query) rather than a Sequelize `where` clause here, since exact
    // JSON-array containment isn't portable across the query builder.
    return Researcher.findAll({ where }).then((rows) =>
      specialisation
        ? rows.filter((r) => (r.specialisations || []).includes(specialisation))
        : rows,
    );
  };

  Researcher.findCommitteeMembers = function findCommitteeMembers() {
    const { Op } = sequelize.Sequelize;
    return Researcher.findAll({
      where: {
        isActive: true,
        [Op.or]: [{ role: RESEARCHER_ROLES.RESEARCH_COMMITTEE }, { isCommittee: true }],
      },
    });
  };

  Researcher.findPendingInvitations = function findPendingInvitations() {
    const { Op } = sequelize.Sequelize;
    return Researcher.scope("withSecrets").findAll({
      where: {
        role: RESEARCHER_ROLES.REVIEWER,
        status: RESEARCHER_STATUSES.INVITED,
        emailVerificationExpire: { [Op.gt]: new Date() },
      },
    });
  };

  Researcher.associate = (models) => {
    // Research, Review, Payment, and Certificate models aren't migrated to
    // MySQL yet (see MIGRATION_PLAN.md) — this association is added back
    // once that table exists, to avoid this model loader failing on a
    // not-yet-created model.
    if (models.Research) {
      Researcher.hasMany(models.Research, { foreignKey: "researcherId", as: "researchProjects" });
    }
  };

  return Researcher;
};
