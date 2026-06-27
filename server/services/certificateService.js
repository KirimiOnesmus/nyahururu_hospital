const Certificate = require("../models/CertificateModel");
const Research = require("../models/researchModel");
const Researcher = require("../models/ResearcherModel");
const { generateVerificationQR } = require("../utils/qrServices");
const { renderCertificatePdf } = require("../utils/certificatePdfService");
const { AppError } = require("../utils/appError");
const { CERTIFICATE_TYPES } = require("../constants/researchIndex");
const fs = require("fs");
const path = require("path");

const CERT_DIR = path.join(process.cwd(), "uploads", "certificates");
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

const _persistPdf = async (certificateNumber, buffer) => {
  const filename = `${certificateNumber}.pdf`;
  const filePath = path.join(CERT_DIR, filename);
  await fs.promises.writeFile(filePath, buffer);
  return { url: `/uploads/certificates/${filename}`, key: filename };
};

// Issue clearance certificate (called after proposal approval)

const issueClearanceCertificate = async (researchId, issuedBy) => {
  const research = await Research.findById(researchId).populate(
    "researcher",
    "name firstName institution",
  );
  if (!research) throw new AppError("Research not found.", 404);

  const existing = await Certificate.findOne({
    research: researchId,
    type: CERTIFICATE_TYPES.PROPOSAL_APPROVAL,
    status: Certificate.CERT_STATUSES.ACTIVE,
  });
  if (existing) return existing; // idempotent — don't double-issue

  const certificateNumber = await Certificate.generateCertificateNumber(
    CERTIFICATE_TYPES.PROPOSAL_APPROVAL,
  );
  const token = Certificate.signToken(certificateNumber);
  const qrCodeDataUrl = await generateVerificationQR(certificateNumber, token);

  const validFrom = new Date();
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  const cert = await Certificate.create({
    type: CERTIFICATE_TYPES.PROPOSAL_APPROVAL,
    certificateNumber,
    research: research._id,
    researcher: research.researcher._id,
    researchTitle: research.title,
    researcherName: research.researcher.name || research.researcher.firstName,
    institution: research.researcher.institution,
    studySites: research.studySites || [],
    researchCode: research.researchId,
    committeeApprovalStatement:
      "This research proposal has been reviewed and approved by the Nyahururu Hospital Research & Ethics Committee in accordance with institutional research governance policy.",
    validFrom,
    validUntil,
    verificationToken: token,
    qrCodeDataUrl,
    issuedBy,
  });

  const pdfBuffer = await renderCertificatePdf(cert);
  const { url, key } = await _persistPdf(certificateNumber, pdfBuffer);
  cert.pdfFile = url;
  cert.pdfFileKey = key;
  await cert.save();

  research.clearanceCertificate = cert._id;
  await research.save();

  return cert;
};

// Issue completion certificate (called after publication — admin can only

const issueCompletionCertificate = async (researchId, issuedBy) => {
  const research = await Research.findById(researchId).populate(
    "researcher",
    "name firstName institution",
  );
  if (!research) throw new AppError("Research not found.", 404);

  const existing = await Certificate.findOne({
    research: researchId,
    type: CERTIFICATE_TYPES.PUBLICATION,
    status: Certificate.CERT_STATUSES.ACTIVE,
  });
  if (existing) return existing;

  const certificateNumber = await Certificate.generateCertificateNumber(
    CERTIFICATE_TYPES.PUBLICATION,
  );
  const token = Certificate.signToken(certificateNumber);
  const qrCodeDataUrl = await generateVerificationQR(certificateNumber, token);

  const cert = await Certificate.create({
    type: CERTIFICATE_TYPES.PUBLICATION,
    certificateNumber,
    research: research._id,
    researcher: research.researcher._id,
    researchTitle: research.title,
    researcherName: research.researcher.name || research.researcher.firstName,
    institution: research.researcher.institution,
    studySites: research.studySites || [],
    researchCode: research.researchId,
    publicationDate: research.publishedAt || new Date(),
    journalName: research.journalName,
    completionStatement:
      "This certifies that the above research has successfully completed all review stages and has been published in the Nyahururu Hospital Research Repository.",
    verificationToken: token,
    qrCodeDataUrl,
    issuedBy,
  });

  const pdfBuffer = await renderCertificatePdf(cert);
  const { url, key } = await _persistPdf(certificateNumber, pdfBuffer);
  cert.pdfFile = url;
  cert.pdfFileKey = key;
  await cert.save();

  research.completionCertificate = cert._id;
  await research.save();

  return cert;
};

// PUBLIC — Verify certificate via QR scan

const verifyCertificate = async (certificateNumber, token) => {
  if (!certificateNumber || !token) {
    throw new AppError("Certificate number and token are required.", 400);
  }

  
  if (!valid) {
    throw new AppError("Invalid or tampered verification code.", 400);
  }

  const cert = await Certificate.findOne({ certificateNumber })
    .select(
      "type certificateNumber researchTitle researcherName institution status issuedAt createdAt validFrom validUntil publicationDate journalName revokedAt revokedReason",
    )
    .lean();

  if (!cert) throw new AppError("Certificate not found.", 404);

  const isExpired =
    cert.type === CERTIFICATE_TYPES.PROPOSAL_APPROVAL &&
    cert.validUntil &&
    new Date(cert.validUntil) < new Date();

  const valid = cert.status === Certificate.CERT_STATUSES.ACTIVE && !isExpired;

  return { valid, expired: !!isExpired, certificate: cert };
};

const getCertificatesForResearcher = async (researcherId) => {
  return Certificate.find({ researcher: researcherId })
    .sort({ createdAt: -1 })
    .select("-verificationToken") 
    .lean();
};

// ADMIN — Revoke

const revokeCertificate = async (certificateId, revokedBy, reason) => {
  if (!reason?.trim())
    throw new AppError("A reason is required to revoke a certificate.", 400);

  const cert = await Certificate.findById(certificateId);
  if (!cert) throw new AppError("Certificate not found.", 404);
  if (cert.status === Certificate.CERT_STATUSES.REVOKED) {
    throw new AppError("Certificate is already revoked.", 400);
  }

  await cert.revoke(revokedBy, reason.trim());
  return cert;
};

const getCertificatesForResearch = async (researchId) => {
  return Certificate.find({ research: researchId })
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = {
  issueClearanceCertificate,
  issueCompletionCertificate,
  verifyCertificate,
  revokeCertificate,
  getCertificatesForResearch,
   getCertificatesForResearcher,
};
