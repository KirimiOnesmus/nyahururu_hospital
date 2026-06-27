const certificateService = require("../services/certificateService");
const Certificate = require("../models/CertificateModel");
const Research = require("../models/researchModel");
const { asyncHandler, sendSuccess, AppError } = require("../utils/appError");
const { isResearchAdmin, hasCommitteeAccess } = require("../middleware/auth");
const path = require("path");

// Caller must be: the research owner, an admin, or have committee access.

const getRequesterId = (req) => (req.researcher?._id || req.user?._id)?.toString();

const assertCanAccessResearchCertificates = async (req, researchId) => {
  if (isResearchAdmin(req) || hasCommitteeAccess(req)) return;

  const research = await Research.findById(researchId).select("researcher");
  if (!research) throw new AppError("Research not found.", 404);

  const ownerId = getRequesterId(req);
  if (!ownerId || research.researcher.toString() !== ownerId) {
    throw new AppError("You do not have access to this research's certificates.", 403);
  }
};

exports.verifyCertificate = asyncHandler(async (req, res) => {
  const { cert, token } = req.query;
  const result = await certificateService.verifyCertificate(cert, token);

  const message = result.expired
    ? "This clearance certificate has expired."
    : result.valid
    ? "Certificate is valid."
    : "Certificate has been revoked.";

  sendSuccess(res, 200, message, result);
});

exports.getCertificatesForResearch = asyncHandler(async (req, res) => {
  await assertCanAccessResearchCertificates(req, req.params.researchId);
  const certs = await certificateService.getCertificatesForResearch(req.params.researchId);
  sendSuccess(res, 200, "Certificates fetched successfully.", { certificates: certs });
});


exports.getMyCertificates = asyncHandler(async (req, res) => {
  const researcherId = req.researcher?._id || req.user?._id;
  if (!researcherId) throw new AppError("Not authenticated.", 401);

  const certs = await certificateService.getCertificatesForResearcher(researcherId);
  sendSuccess(res, 200, "Certificates fetched successfully.", { certificates: certs });
});

exports.revokeCertificate = asyncHandler(async (req, res) => {
  const revokedBy = req.researcher?._id || req.user?._id;
  const cert = await certificateService.revokeCertificate(req.params.id, revokedBy, req.body.reason);
  sendSuccess(res, 200, "Certificate revoked successfully.", {
    certificate: { id: cert._id, certificateNumber: cert.certificateNumber, status: cert.status },
  });
});

exports.downloadCertificatePdf = asyncHandler(async (req, res) => {
  const cert = await Certificate.findById(req.params.id);
  if (!cert) throw new AppError("Certificate not found.", 404);

  await assertCanAccessResearchCertificates(req, cert.research);

  if (!cert.pdfFile) throw new AppError("Certificate PDF is not available.", 404);

  const filePath = path.join(process.cwd(), cert.pdfFile);
  const disposition = req.query.mode === "view" ? "inline" : "attachment";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${disposition}; filename="${cert.certificateNumber}.pdf"`);
  res.sendFile(filePath);
});