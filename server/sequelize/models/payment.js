"use strict";

const {
  PAYMENT_TYPES,
  PAYMENT_STATUSES,
} = require("../../constants/researchIndex");

const TYPE_VALUES = Object.values(PAYMENT_TYPES);
const STATUS_VALUES = Object.values(PAYMENT_STATUSES);

// Download-token columns are excluded from default SELECTs to mirror the
// Mongoose `select: false` behavior — they're only pulled when the
// download flow explicitly asks for them.
const SECRET_COLUMNS = ["downloadToken", "downloadTokenExpire"];

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      researcherId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researchers", key: "id" },
        // Anonymous paper downloads are legal callers (no researcher
        // account required). SET NULL preserves the payment record even
        // if the researcher account is later removed — revenue history
        // must survive account lifecycle events.
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      type: {
        type: DataTypes.ENUM(...TYPE_VALUES),
        allowNull: false,
      },
      researchId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "researches", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },

      // Money — DECIMAL, same reasoning as the procurement cluster.
      // Amounts in KES can hit 6 digits for real submission fees.
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: { args: [0.01], msg: "Amount must be greater than zero" } },
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "KES",
      },

      phone: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      buyerEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
        set(value) {
          this.setDataValue("buyerEmail", value ? value.trim().toLowerCase() : value);
        },
      },

      // ── M-Pesa STK-push identifiers ───────────────────────────────
      merchantRequestId: DataTypes.STRING(100),
      // checkoutRequestId is guaranteed unique by Safaricom per STK
      // push — using it as an idempotency key means retried callbacks
      // don't create duplicate rows.
      checkoutRequestId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
      },
      // Only present after a successful M-Pesa completion; sparse
      // unique via MySQL's default multiple-NULL-allowed semantics.
      mpesaReceiptNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },
      // M-Pesa returns this as a numeric string like "20260722143000".
      // Kept as STRING to match the raw callback shape — the parsing
      // decision (which timezone, which format) stays in the controller.
      transactionDate: DataTypes.STRING(30),
      status: {
        type: DataTypes.ENUM(...STATUS_VALUES),
        allowNull: false,
        defaultValue: PAYMENT_STATUSES.PENDING,
      },

      resultCode: DataTypes.STRING(20),
      resultDesc: DataTypes.STRING(500),
      refundedAt: DataTypes.DATE,
      refundReason: DataTypes.STRING(500),
      refundCode: DataTypes.STRING(50),
      refundAmount: DataTypes.DECIMAL(12, 2),

      // ── Secure download token (hidden by default scope) ───────────
      downloadToken: DataTypes.STRING(255),
      downloadTokenExpire: DataTypes.DATE,
      downloadedAt: DataTypes.DATE,
    },
    {
      tableName: "payments",
      defaultScope: {
        attributes: { exclude: SECRET_COLUMNS },
      },
      scopes: {
        withSecrets: { attributes: { include: SECRET_COLUMNS } },
      },
      indexes: [
        { unique: true, fields: ["checkout_request_id"] },
        { unique: true, fields: ["mpesa_receipt_number"] },
        { fields: ["status", "type"] },
        { fields: ["researcher_id", "type"] },
        { fields: ["research_id", "status"] },
        { fields: ["created_at"] },
        { fields: ["phone"] },
      ],
    },
  );

  // ── Virtuals (read-only) ──────────────────────────────────────────
  Object.defineProperty(Payment.prototype, "isRevenue", {
    get() {
      return this.status === PAYMENT_STATUSES.COMPLETED;
    },
  });
  Object.defineProperty(Payment.prototype, "isRefundable", {
    get() {
      return this.status === PAYMENT_STATUSES.COMPLETED && !this.refundedAt;
    },
  });

  /**
   * Aggregate completed-payment revenue for a research row, split by
   * type. Ported from the Mongoose static of the same name — same
   * output shape so downstream consumers don't need to change.
   */
  Payment.getRevenueForResearch = async function getRevenueForResearch(researchId) {
    const rows = await Payment.findAll({
      where: { researchId, status: PAYMENT_STATUSES.COMPLETED },
      attributes: ["type", "amount"],
      raw: true,
    });

    const proposalRows = rows.filter((r) => r.type === PAYMENT_TYPES.PROPOSAL_SUBMISSION);
    const downloadRows = rows.filter((r) => r.type === PAYMENT_TYPES.PAPER_DOWNLOAD);
    const sum = (list) => list.reduce((s, r) => s + Number(r.amount), 0);

    return {
      proposalRevenue: sum(proposalRows),
      downloadRevenue: sum(downloadRows),
      downloadCount: downloadRows.length,
      totalRevenue: sum(rows),
    };
  };

  Payment.associate = (models) => {
    Payment.belongsTo(models.Researcher, { foreignKey: "researcherId", as: "researcher" });
    if (models.Research) {
      Payment.belongsTo(models.Research, { foreignKey: "researchId", as: "research" });
    }
  };

  Payment.TYPES = TYPE_VALUES;
  Payment.STATUSES = STATUS_VALUES;

  return Payment;
};
