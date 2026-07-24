"use strict";

const crypto = require("crypto");
const { CERTIFICATE_TYPES } = require("../../constants/researchIndex");

const TYPE_VALUES = Object.values(CERTIFICATE_TYPES);
const CERT_STATUSES = Object.freeze({ ACTIVE: "active", REVOKED: "revoked" });
const STATUS_VALUES = Object.values(CERT_STATUSES);

module.exports = (sequelize, DataTypes) => {
  const Certificate = sequelize.define(
    "Certificate",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM(...TYPE_VALUES),
        allowNull: false,
      },
      // Format: NCRH-CLR-{year}-{5digits} or NCRH-CPL-{year}-{5digits}.
      // Set via the beforeValidate hook using the Counter model.
      certificateNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      researchId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "researches", key: "id" },
        // A certificate is issued against a specific research row; if
        // the research is soft-deleted, the certificate stays valid
        // (the researcher may still need it for external verification).
        // Hard deletion is a manual/RESTRICT-guarded operation.
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      researcherId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "researchers", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },

      // Snapshot fields — denormalized at issue time so a certificate
      // never mutates when the underlying research/researcher is
      // updated. Matches the Mongoose model's intent exactly.
      researchTitle: { type: DataTypes.STRING(500), allowNull: false },
      researcherName: { type: DataTypes.STRING(150), allowNull: false },
      institution: DataTypes.STRING(255),
      // Small string array — JSON.
      studySites: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      researchCode: DataTypes.STRING(100),

      committeeApprovalStatement: DataTypes.TEXT,
      validFrom: DataTypes.DATE,
      validUntil: DataTypes.DATE,

      publicationDate: DataTypes.DATE,
      journalName: DataTypes.STRING(255),
      completionStatement: DataTypes.TEXT,

      // Verification: HMAC token (not secret-reversible) + QR PNG data URL
      verificationToken: { type: DataTypes.STRING(64), allowNull: false },
      // Base64-encoded PNG data URL — can grow large, use MEDIUMTEXT
      // rather than TEXT (which caps at 64 KiB and would silently
      // truncate the QR image once complexity grew).
      qrCodeDataUrl: { type: DataTypes.TEXT("medium") },
      pdfFile: DataTypes.STRING(500),
      pdfFileKey: DataTypes.STRING(255),

      signatureAreaLabel: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "Director, Research & Ethics Committee",
      },
      sealImageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },

      status: {
        type: DataTypes.ENUM(...STATUS_VALUES),
        allowNull: false,
        defaultValue: CERT_STATUSES.ACTIVE,
      },
      revokedAt: DataTypes.DATE,
      revokedById: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      revokedReason: DataTypes.STRING(500),

      // Self-referential FK for supersession chains (e.g. a corrected
      // certificate supersedes the original).
      supersedesId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "certificates", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },

      issuedById: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "certificates",
      indexes: [
        { unique: true, fields: ["certificate_number"] },
        { fields: ["type"] },
        { fields: ["status"] },
        { fields: ["research_id"] },
        { fields: ["research_id", "type"] },
      ],
      hooks: {
        beforeValidate: async (cert, options) => {
          if (!cert.certificateNumber) {
            cert.certificateNumber = await Certificate.generateCertificateNumber(
              cert.type,
              { transaction: options.transaction },
            );
          }
          if (!cert.verificationToken && cert.certificateNumber) {
            cert.verificationToken = Certificate.signToken(cert.certificateNumber);
          }
        },
      },
    },
  );

  /**
   * Atomic per-year, per-type sequence via the Counter model. Same
   * pattern used for tenders and research IDs — fixes the TOCTOU race
   * present in the Mongoose implementation's find-then-inc.
   */
  Certificate.generateCertificateNumber = async function generateCertificateNumber(
    type,
    options = {},
  ) {
    const year = new Date().getFullYear();
    const prefix =
      type === CERTIFICATE_TYPES.PROPOSAL_APPROVAL ? "NCRH-CLR" : "NCRH-CPL";
    const key = `${prefix}-${year}`;
    const seq = await sequelize.models.Counter.incrementAndGet(key, {
      transaction: options.transaction,
    });
    return `${key}-${String(seq).padStart(5, "0")}`;
  };

  /**
   * Deterministic HMAC over the certificate number. Truncated to 24
   * hex chars to keep the QR-code payload short — well over 96 bits of
   * entropy, ample for the verification use case (attacker can't
   * enumerate certificate numbers, and any forgery would need the
   * signing secret). Signing secret is required at startup so a
   * missing key here is a programming error, not a runtime surprise.
   */
  Certificate.signToken = function signToken(certificateNumber) {
    const secret = process.env.CERTIFICATE_SIGNING_SECRET;
    if (!secret) {
      throw new Error(
        "CERTIFICATE_SIGNING_SECRET is not set — refusing to sign certificate tokens.",
      );
    }
    return crypto
      .createHmac("sha256", secret)
      .update(certificateNumber)
      .digest("hex")
      .slice(0, 24);
  };

  /**
   * Timing-safe comparison — matters here because a naive `===` would
   * leak byte-position information to an attacker probing token
   * variants over the verification endpoint.
   */
  Certificate.verifyToken = function verifyToken(certificateNumber, token) {
    const expected = Certificate.signToken(certificateNumber);
    const a = Buffer.from(expected);
    const b = Buffer.from(token || "");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  };

  Certificate.verifyAndFetch = async function verifyAndFetch(
    certificateNumber,
    token,
  ) {
    const cert = await Certificate.findOne({ where: { certificateNumber } });
    if (!cert) return { valid: false, certificate: null };
    const valid =
      cert.status === CERT_STATUSES.ACTIVE &&
      Certificate.verifyToken(certificateNumber, token);
    return { valid, certificate: valid ? cert : null };
  };

  Certificate.prototype.revoke = function revoke(revokedById, reason) {
    this.status = CERT_STATUSES.REVOKED;
    this.revokedAt = new Date();
    this.revokedById = revokedById ?? null;
    this.revokedReason = reason ?? null;
    return this.save();
  };

  Certificate.associate = (models) => {
    Certificate.belongsTo(models.Research, { foreignKey: "researchId", as: "research" });
    Certificate.belongsTo(models.Researcher, { foreignKey: "researcherId", as: "researcher" });
    Certificate.belongsTo(models.Researcher, { foreignKey: "revokedById", as: "revoker" });
    Certificate.belongsTo(models.Researcher, { foreignKey: "issuedById", as: "issuer" });
    Certificate.belongsTo(Certificate, { foreignKey: "supersedesId", as: "supersededCertificate" });
  };

  Certificate.TYPES = TYPE_VALUES;
  Certificate.STATUSES = STATUS_VALUES;
  Certificate.CERT_STATUSES = CERT_STATUSES;

  return Certificate;
};
