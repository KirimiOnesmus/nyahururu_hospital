"use strict";

const path = require("path");
const certificateService = require("../services/certificateService");
const { Certificate, Research } = require("../sequelize/models");
const { asyncHandler, sendSuccess, AppError } = require("../utils/appError");
const { isResearchAdmin, hasCommitteeAccess } = require("../middleware/auth");

// ── Access-control helpers ──────────────────────────────────────────

// Caller must be the research owner, a research admin (staff user), or
// a committee member. Numeric IDs now — auth middleware attaches
// Sequelize instances so both req.user and req.researcher expose .id.
const getRequesterId = (req) => {
  const id = req.researcher?.id ?? req.user?.id;
  return id === undefined || id === null ? null : String(id);
};

const assertCanAccessResearchCertificates = async (req, researchId) => {
  if (isResearchAdmin(req) || hasCommitteeAccess(req)) return;

  const research = await Research.findByPk(researchId, {
    attributes: ["researcherId"],
  });
  if (!research) throw new AppError("Research not found.", 404);

  const ownerId = getRequesterId(req);
  if (!ownerId || String(research.researcherId) !== ownerId) {
    throw new AppError("You do not have access to this research's certificates.", 403);
  }
};

// ── PUBLIC — Verify certificate (QR scan) ───────────────────────────
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

// ── Certificates for a specific research ────────────────────────────
exports.getCertificatesForResearch = asyncHandler(async (req, res) => {
  await assertCanAccessResearchCertificates(req, req.params.researchId);
  const certs = await certificateService.getCertificatesForResearch(req.params.researchId);
  sendSuccess(res, 200, "Certificates fetched successfully.", { certificates: certs });
});

// ── Certificates owned by the authenticated caller ──────────────────
exports.getMyCertificates = asyncHandler(async (req, res) => {
  const researcherId = req.researcher?.id ?? req.user?.id;
  if (researcherId === undefined || researcherId === null) {
    throw new AppError("Not authenticated.", 401);
  }

  const certs = await certificateService.getCertificatesForResearcher(researcherId);
  sendSuccess(res, 200, "Certificates fetched successfully.", { certificates: certs });
});

// ── ADMIN — Revoke ──────────────────────────────────────────────────
exports.revokeCertificate = asyncHandler(async (req, res) => {
  const revokedBy = req.researcher?.id ?? req.user?.id;
  const cert = await certificateService.revokeCertificate(
    req.params.id,
    revokedBy,
    req.body.reason,
  );
  sendSuccess(res, 200, "Certificate revoked successfully.", {
    certificate: {
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      status: cert.status,
    },
  });
});

// ── Download/view certificate PDF ───────────────────────────────────
exports.downloadCertificatePdf = asyncHandler(async (req, res) => {
  const cert = await Certificate.findByPk(req.params.id);
  if (!cert) throw new AppError("Certificate not found.", 404);

  // Ownership check uses the certificate's researchId (FK), not the
  // .research alias — no include needed for this branch.
  await assertCanAccessResearchCertificates(req, cert.researchId);

  if (!cert.pdfFile) throw new AppError("Certificate PDF is not available.", 404);

  const filePath = path.join(process.cwd(), cert.pdfFile.replace(/^\//, ""));
  const disposition = req.query.mode === "view" ? "inline" : "attachment";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${cert.certificateNumber}.pdf"`,
  );
  res.sendFile(filePath);
});
