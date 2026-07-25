"use strict";

const fs = require("fs");
const path = require("path");
const { Certificate, Research, Researcher } = require("../sequelize/models");
const { generateVerificationQR } = require("../utils/qrServices");
const { renderCertificatePdf } = require("../utils/certificatePdfService");
const { AppError } = require("../utils/appError");
const { CERTIFICATE_TYPES } = require("../constants/researchIndex");

const CERT_DIR = path.join(process.cwd(), "uploads", "certificates");
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

const _persistPdf = async (certificateNumber, buffer) => {
  const filename = `${certificateNumber}.pdf`;
  const filePath = path.join(CERT_DIR, filename);
  await fs.promises.writeFile(filePath, buffer);
  return { url: `/uploads/certificates/${filename}`, key: filename };
};

// The Researcher-side include used for issuance denormalisation. The
// Mongoose flow only pulled a few fields off the researcher for the
// certificate snapshot, and that's preserved here.
const RESEARCHER_SNAPSHOT_ATTRS = ["id", "name", "firstName", "institution"];

// ── Issue clearance certificate (proposal approval) ──────────────────
const issueClearanceCertificate = async (researchId, issuedBy) => {
  const research = await Research.findByPk(researchId, {
    include: [
      { model: Researcher, as: "researcher", attributes: RESEARCHER_SNAPSHOT_ATTRS },
    ],
  });
  if (!research) throw new AppError("Research not found.", 404);

  // Idempotency: if an active clearance cert already exists for this
  // research, hand it back rather than issuing a duplicate. Matches the
  // Mongoose behaviour and is important for retryable workflows.
  const existing = await Certificate.findOne({
    where: {
      researchId,
      type: CERTIFICATE_TYPES.PROPOSAL_APPROVAL,
      status: Certificate.CERT_STATUSES.ACTIVE,
    },
  });
  if (existing) return existing;

  const validFrom = new Date();
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  // The Certificate model's beforeValidate hook auto-generates
  // certificateNumber + verificationToken from the Counter — we don't
  // need to precompute them like the Mongoose version did. Only the QR
  // (which depends on the number+token) is generated after the row
  // has its number.
  const cert = await Certificate.create({
    type: CERTIFICATE_TYPES.PROPOSAL_APPROVAL,
    researchId: research.id,
    researcherId: research.researcher.id,
    researchTitle: research.title,
    researcherName: research.researcher.name || research.researcher.firstName,
    institution: research.researcher.institution,
    studySites: research.studySites || [],
    researchCode: research.researchId,
    committeeApprovalStatement:
      "This research proposal has been reviewed and approved by the Nyahururu Hospital Research & Ethics Committee in accordance with institutional research governance policy.",
    validFrom,
    validUntil,
    issuedById: issuedBy,
  });

  // Generate the QR after the row exists so we can use its persisted
  // number + token (both come from the model hook).
  cert.qrCodeDataUrl = await generateVerificationQR(
    cert.certificateNumber,
    cert.verificationToken,
  );

  const pdfBuffer = await renderCertificatePdf(cert);
  const { url, key } = await _persistPdf(cert.certificateNumber, pdfBuffer);
  cert.pdfFile = url;
  cert.pdfFileKey = key;
  await cert.save();

  research.clearanceCertificateId = cert.id;
  await research.save();

  return cert;
};

// ── Issue completion certificate (publication) ──────────────────────
const issueCompletionCertificate = async (researchId, issuedBy) => {
  const research = await Research.findByPk(researchId, {
    include: [
      { model: Researcher, as: "researcher", attributes: RESEARCHER_SNAPSHOT_ATTRS },
    ],
  });
  if (!research) throw new AppError("Research not found.", 404);

  const existing = await Certificate.findOne({
    where: {
      researchId,
      type: CERTIFICATE_TYPES.PUBLICATION,
      status: Certificate.CERT_STATUSES.ACTIVE,
    },
  });
  if (existing) return existing;

  const cert = await Certificate.create({
    type: CERTIFICATE_TYPES.PUBLICATION,
    researchId: research.id,
    researcherId: research.researcher.id,
    researchTitle: research.title,
    researcherName: research.researcher.name || research.researcher.firstName,
    institution: research.researcher.institution,
    studySites: research.studySites || [],
    researchCode: research.researchId,
    publicationDate: research.publishedAt || new Date(),
    journalName: research.journalName,
    completionStatement:
      "This certifies that the above research has successfully completed all review stages and has been published in the Nyahururu Hospital Research Repository.",
    issuedById: issuedBy,
  });

  cert.qrCodeDataUrl = await generateVerificationQR(
    cert.certificateNumber,
    cert.verificationToken,
  );

  const pdfBuffer = await renderCertificatePdf(cert);
  const { url, key } = await _persistPdf(cert.certificateNumber, pdfBuffer);
  cert.pdfFile = url;
  cert.pdfFileKey = key;
  await cert.save();

  research.completionCertificateId = cert.id;
  await research.save();

  return cert;
};

// ── PUBLIC: verify a certificate via QR scan ────────────────────────
//
// NOTE (bug fixed on cutover): the Mongoose version of this function
// referenced `valid` on line 139 BEFORE it was defined further down
// (at ~line 156 in the original file). It would have thrown
// `ReferenceError: Cannot access 'valid' before initialization` on
// every call. Re-ordered so `valid` is computed first, then the
// token-tamper check runs, then the certificate row is loaded — which
// is what the original code clearly intended.
const verifyCertificate = async (certificateNumber, token) => {
  if (!certificateNumber || !token) {
    throw new AppError("Certificate number and token are required.", 400);
  }

  // Timing-safe HMAC check — see Certificate.verifyToken in the model.
  const tokenValid = Certificate.verifyToken(certificateNumber, token);
  if (!tokenValid) {
    throw new AppError("Invalid or tampered verification code.", 400);
  }

  const cert = await Certificate.findOne({
    where: { certificateNumber },
    attributes: [
      "type", "certificateNumber", "researchTitle", "researcherName",
      "institution", "status", "createdAt", "validFrom", "validUntil",
      "publicationDate", "journalName", "revokedAt", "revokedReason",
    ],
  });

  if (!cert) throw new AppError("Certificate not found.", 404);

  const isExpired =
    cert.type === CERTIFICATE_TYPES.PROPOSAL_APPROVAL &&
    cert.validUntil &&
    new Date(cert.validUntil) < new Date();

  const valid = cert.status === Certificate.CERT_STATUSES.ACTIVE && !isExpired;

  return { valid, expired: !!isExpired, certificate: cert };
};

// ── LIST / QUERY ────────────────────────────────────────────────────
const getCertificatesForResearcher = async (researcherId) => {
  return Certificate.findAll({
    where: { researcherId },
    order: [["createdAt", "DESC"]],
    // Exclude the HMAC token from the response — same intent as the
    // Mongoose .select("-verificationToken"). Anyone who can already
    // read the cert on the API doesn't need the token; only public QR
    // scan endpoints go through verifyCertificate above.
    attributes: { exclude: ["verificationToken"] },
  });
};

const getCertificatesForResearch = async (researchId) => {
  return Certificate.findAll({
    where: { researchId },
    order: [["createdAt", "DESC"]],
  });
};

// ── ADMIN: revoke ───────────────────────────────────────────────────
const revokeCertificate = async (certificateId, revokedBy, reason) => {
  if (!reason?.trim()) {
    throw new AppError("A reason is required to revoke a certificate.", 400);
  }

  const cert = await Certificate.findByPk(certificateId);
  if (!cert) throw new AppError("Certificate not found.", 404);
  if (cert.status === Certificate.CERT_STATUSES.REVOKED) {
    throw new AppError("Certificate is already revoked.", 400);
  }

  // Delegate to the model's revoke() method — sets status, revokedAt,
  // revokedById, revokedReason and saves.
  await cert.revoke(revokedBy, reason.trim());
  return cert;
};

module.exports = {
  issueClearanceCertificate,
  issueCompletionCertificate,
  verifyCertificate,
  revokeCertificate,
  getCertificatesForResearch,
  getCertificatesForResearcher,
};
