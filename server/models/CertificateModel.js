const mongoose = require("mongoose");
const crypto   = require("crypto");
const Counter = require("./CounterModel");
const { CERTIFICATE_TYPES } = require("../constants/researchIndex");


const CERT_STATUSES = Object.freeze({
  ACTIVE:  "active",
  REVOKED: "revoked",
});

const certificateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(CERTIFICATE_TYPES),
      required: true,
      index: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    research: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Research",
      required: true,
      index: true,
    },
    researcher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Researcher",
      required: true,
    },

    // Snapshot fields (denormalized at issue-time — certs must not change if the
   
    researchTitle:   { type: String, required: true },
    researcherName:  { type: String, required: true },
    institution:     { type: String, trim: true },
    studySites:      [{ type: String, trim: true }],
    researchCode:    { type: String, trim: true }, // optional field for NACOSTI code or similar

    // Clearance-specific
    committeeApprovalStatement: { type: String, trim: true },
    validFrom: { type: Date },
    validUntil: { type: Date },

    // Completion-specific
    publicationDate:   { type: Date },
    journalName:       { type: String, trim: true },
    completionStatement: { type: String, trim: true },

    // Verification
    verificationToken: { type: String, required: true }, // HMAC, not secret-reversible
    qrCodeDataUrl:      { type: String }, // base64 PNG, embedded directly — no separate file needed
    pdfFile:            { type: String }, // path/key to generated PDF
    pdfFileKey:          { type: String },

    signatureAreaLabel: { type: String, default: "Director, Research & Ethics Committee" },
    sealImageUrl:        { type: String, default: null },

    status: {
      type: String,
      enum: Object.values(CERT_STATUSES),
      default: CERT_STATUSES.ACTIVE,
      index: true,
    },
    revokedAt:     { type: Date, default: null },
    revokedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "Researcher" },
    revokedReason: { type: String, trim: true, default: null },

   
    supersedes: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate", default: null },

    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Researcher" }, // admin/system
  },
  { timestamps: true }
);

certificateSchema.index({ research: 1, type: 1 });

certificateSchema.statics.generateCertificateNumber = async function (type) {
  const year = new Date().getFullYear();
  const prefix = type === CERTIFICATE_TYPES.PROPOSAL_APPROVAL ? "NCRH-CLR" : "NCRH-CPL";
  const key = `${prefix}-${year}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );

  return `${key}-${String(counter.seq).padStart(5, "0")}`;
};

certificateSchema.statics.signToken = function (certificateNumber) {
  return crypto
    .createHmac("sha256", process.env.CERTIFICATE_SIGNING_SECRET)
    .update(certificateNumber)
    .digest("hex")
    .slice(0, 24); // truncate — plenty of entropy for this purpose, keeps QR payload short
};

certificateSchema.statics.verifyToken = function (certificateNumber, token) {
  const expected = this.signToken(certificateNumber);
 
  const a = Buffer.from(expected);
  const b = Buffer.from(token || "");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

certificateSchema.statics.verifyAndFetch = async function (certificateNumber, token) {
  const cert = await this.findOne({ certificateNumber });
  if (!cert) return { valid: false, certificate: null };
  const valid = cert.status === CERT_STATUSES.ACTIVE && this.verifyToken(certificateNumber, token);
  return { valid, certificate: valid ? cert : null };
};


certificateSchema.methods.revoke = function (revokedBy, reason) {
  this.status = CERT_STATUSES.REVOKED;
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  this.revokedReason = reason;
  return this.save();
};

module.exports.CERTIFICATE_TYPES = CERTIFICATE_TYPES;
module.exports.CERT_STATUSES = CERT_STATUSES;