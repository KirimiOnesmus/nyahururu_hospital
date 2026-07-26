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


const RESEARCHER_SNAPSHOT_ATTRS = ["id", "name", "firstName", "institution"];

const issueClearanceCertificate = async (researchId, issuedBy) => {
  const research = await Research.findByPk(researchId, {
    include: [
      { model: Researcher, as: "researcher", attributes: RESEARCHER_SNAPSHOT_ATTRS },
    ],
  });
  if (!research) throw new AppError("Research not found.", 404);


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

//  PUBLIC: verify a certificate via QR scan 

const verifyCertificate = async (certificateNumber, token) => {
  if (!certificateNumber || !token) {
    throw new AppError("Certificate number and token are required.", 400);
  }

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


const getCertificatesForResearcher = async (researcherId) => {
  return Certificate.findAll({
    where: { researcherId },
    order: [["createdAt", "DESC"]],

    attributes: { exclude: ["verificationToken"] },
  });
};

const getCertificatesForResearch = async (researchId) => {
  return Certificate.findAll({
    where: { researchId },
    order: [["createdAt", "DESC"]],
  });
};

const revokeCertificate = async (certificateId, revokedBy, reason) => {
  if (!reason?.trim()) {
    throw new AppError("A reason is required to revoke a certificate.", 400);
  }

  const cert = await Certificate.findByPk(certificateId);
  if (!cert) throw new AppError("Certificate not found.", 404);
  if (cert.status === Certificate.CERT_STATUSES.REVOKED) {
    throw new AppError("Certificate is already revoked.", 400);
  }
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
