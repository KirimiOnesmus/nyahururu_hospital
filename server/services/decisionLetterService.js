"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { renderDecisionLetterPdf, mergeWithAttachment } = require("../utils/decisionLetterPdfService");
const { SUBMISSION_TYPES } = require("../constants/researchIndex");

const LETTER_DIR = path.join(process.cwd(), "uploads", "decision-letters");
if (!fs.existsSync(LETTER_DIR)) fs.mkdirSync(LETTER_DIR, { recursive: true });

const _nextLetterNumber = (research) => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString("hex");
  return `NCRH-DEC-${year}-${research.id}-${random}`;
};


const issueDecisionLetter = async (research, decision, comment, options = {}) => {
  const researcherDoc = research.researcher;
  if (!researcherDoc) return null;

  const seruNumber = research.seruNumber || `${research.id}`;
  const letterNumber = _nextLetterNumber(research);

  let pdfBuffer = await renderDecisionLetterPdf({
    letterNumber,
    seruNumber,
    decisionDate: new Date(),
    researcherName: researcherDoc.name || researcherDoc.firstName || "Researcher",
    researchTitle: research.title,
    submissionType: research.submissionType,
    decision,
    comment: comment || null,
    approvalValidUntil: research.approvalValidUntil || null,
  });


  if (options.officerAttachmentPath) {
    const fullPath = path.isAbsolute(options.officerAttachmentPath)
      ? options.officerAttachmentPath
      : path.join(process.cwd(), options.officerAttachmentPath);
    if (fs.existsSync(fullPath)) {
      pdfBuffer = await mergeWithAttachment(pdfBuffer, fullPath);
    }
  }

  const filename = `${letterNumber.replace(/\//g, "-")}.pdf`;
  const filePath = path.join(LETTER_DIR, filename);
  await fs.promises.writeFile(filePath, pdfBuffer);

  research.decisionLetterNumber = seruNumber;
  research.decisionLetterFile = `/uploads/decision-letters/${filename}`;
  research.decisionLetterFileKey = filename;
  research.decisionLetterIssuedAt = new Date();
  await research.save();

  return research;
};

module.exports = { issueDecisionLetter };
