"use strict";

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const DECISION_LABEL = {
  approved: "Approved",
  rejected: "Not Approved",
  revision_requested: "Revision Requested",
  returned_for_correction: "Returned for Correction",
  suspended: "Study Suspended",
};

const DECISION_BODY = {
  approved: (letter) => {
    // The stage is woven into the approval sentence so it reads naturally
    // (e.g. "the continuing review is granted approval …").
    const STAGE_SUBJECT = {
      initial_proposal: "the research proposal",
      amendment: "the protocol amendment",
      continuing_review: "the continuing review (progress report)",
      study_closure: "the study closure",
    };
    const subject = STAGE_SUBJECT[letter.submissionType] || "the study";
    const isClosure = letter.submissionType === "study_closure";
    const lines = [];
    lines.push(
      `Reference is made to your submission. The Nyahururu County Referral Hospital ` +
      `Scientific and Ethics Review Unit (SERU) has reviewed the study documents.`
    );
    lines.push("");
    lines.push(
      `This is to inform you that the committee has determined that the submission meets ` +
      `all required ethical and scientific standards.`
    );
    lines.push("");
    if (isClosure) {
      lines.push(
        `Consequently, ${subject} is approved and the study is formally closed. ` +
        `The Scientific and Ethics Review Unit (SERU) acknowledges the completion of ` +
        `this study, all closure requirements having been met.`
      );
    } else if (letter.approvalValidUntil) {
      const validDate = letter.approvalValidUntil instanceof Date
        ? letter.approvalValidUntil : new Date(letter.approvalValidUntil);
      const effectiveDate = letter.decisionDate instanceof Date
        ? letter.decisionDate : new Date(letter.decisionDate);
      lines.push(
        `Consequently, ${subject} is granted approval effective ` +
        `${formatLetterDate(effectiveDate)} through ${formatLetterDate(validDate)}. ` +
        `Please note that authorization to conduct this study will automatically expire ` +
        `on ${formatLetterDate(validDate)}. If you plan to continue with data collection ` +
        `or analysis beyond this date, please submit an application for continuing ` +
        `approval to SERU.`
      );
    } else {
      lines.push(
        `Consequently, ${subject} is granted approval. You are required to submit any ` +
        `amendments to this protocol and any other information pertinent to human ` +
        `participation in this study to the SERU for review prior to initiation.`
      );
    }
    lines.push("");
    lines.push(isClosure ? "The study is now formally closed." : "You may continue with the study.");
    return lines.join("\n");
  },
  revision_requested: () =>
    `Reference is made to your submission. The Nyahururu County Referral Hospital ` +
    `Scientific and Ethics Review Unit (SERU) has reviewed the study documents.\n\n` +
    `This is to inform you that the committee has determined that revisions are ` +
    `required before the submission can be approved. Please address the issues ` +
    `outlined in the committee commentary below and resubmit the revised documents ` +
    `for further review.`,
  rejected: () =>
    `Reference is made to your submission. The Nyahururu County Referral Hospital ` +
    `Scientific and Ethics Review Unit (SERU) has reviewed the study documents.\n\n` +
    `This is to inform you that the committee has determined that the submission ` +
    `does not meet the required ethical and scientific standards. The submission ` +
    `has not been approved. Please refer to the committee commentary below for details.`,
  suspended: () =>
    `Reference is made to your submission. The Nyahururu County Referral Hospital ` +
    `Scientific and Ethics Review Unit (SERU) has reviewed the study documents.\n\n` +
    `This is to inform you that the committee has determined that the study must ` +
    `be suspended pending further review. Please refer to the committee commentary ` +
    `below for details and any required corrective actions.`,
};

const formatLetterDate = (d) => {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });
};

const SUBMISSION_TYPE_LABEL = {
  initial_proposal: "Research Proposal",
  amendment: "Protocol Amendment",
  continuing_review: "Continuing Review Submission (Request for Annual Renewal)",
  study_closure: "Study Closure Request",
};

const BRAND_BLUE = "#0066cc";
const INK = "#1a1a1a";
const MUTED = "#5c5c5c";

const renderDecisionLetterPdf = (letter) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 56, bottom: 56, left: 64, right: 64 } });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const leftMargin = doc.page.margins.left;

    const logoPath = path.join(__dirname, "..", "assets", "ncrh-logo.png");
    const logoFallback = path.join(__dirname, "..", "uploads", "public", "logo.png");
    const logoWidth = 64;
    try {
      const actualLogo = fs.existsSync(logoPath) ? logoPath : (fs.existsSync(logoFallback) ? logoFallback : null);
      if (actualLogo) {
        doc.image(actualLogo, leftMargin + pageWidth / 2 - logoWidth / 2, doc.y, { width: logoWidth });
        doc.moveDown(0.6);
      }
    } catch (err) {
      console.warn("[decisionLetterPdfService] logo skipped:", err.message);
    }


    doc.moveDown(6.0);
    doc.fontSize(15).font("Helvetica-Bold").fillColor(INK)
      .text("NYAHURURU COUNTY REFERRAL HOSPITAL", { align: "center" });
    doc.fontSize(10.5).font("Helvetica-Bold").fillColor(BRAND_BLUE)
      .text("SCIENTIFIC AND ETHICS REVIEW UNIT (SERU)", { align: "center" });
    doc.fillColor(INK);
    doc.moveDown(0.35);
    doc.fontSize(8).font("Helvetica").fillColor(MUTED)
      .text("P.O. Box 90-20300, Nyahururu   |   seru@ncrh.go.ke   |   www.ncrh.go.ke", { align: "center" });
    doc.fillColor(INK);
doc.moveDown(0.9);

    doc.moveDown(0.6);
    doc.moveTo(leftMargin, doc.y).lineTo(leftMargin + pageWidth, doc.y)
      .lineWidth(1.5).strokeColor(BRAND_BLUE).stroke();
    doc.moveDown(1.2);


    const seruNum = letter.seruNumber || letter.letterNumber || "—";
    const genDate = letter.decisionDate ? new Date(letter.decisionDate) : new Date();
    const dateStr = formatLetterDate(genDate);
    // Letter should be collected within two weeks of generation.
    const collectBy = new Date(genDate);
    collectBy.setDate(collectBy.getDate() + 14);
    const collectStr = formatLetterDate(collectBy);

    doc.fontSize(9.5).font("Helvetica-Bold");
    const refY = doc.y;
    doc.text(`Ref: ${seruNum}`, leftMargin, refY, { width: pageWidth * 0.6 });
    doc.text(dateStr, leftMargin, refY, { width: pageWidth, align: "right" });
    doc.moveDown(0.45);
    doc.fontSize(8.5).font("Helvetica").fillColor(MUTED)
      .text(`Please collect this letter by ${collectStr}.`, leftMargin, doc.y, {
        width: pageWidth,
        align: "right",
      });
    doc.fillColor(INK);
    doc.moveDown(1.0);

  
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("TO:", leftMargin, doc.y);
    doc.text(`${(letter.researcherName || "Principal Investigator").toUpperCase()}`, leftMargin + 28, doc.y - doc.currentLineHeight(), { width: pageWidth - 30 });
    // doc.text("PRINCIPAL INVESTIGATOR.", leftMargin + 28, doc.y);

    if (letter.throughName) {
      doc.moveDown(0.3);
      doc.text("THROUGH:", leftMargin, doc.y);
      doc.text(`${letter.throughName.toUpperCase()}.`, leftMargin + 62, doc.y - doc.currentLineHeight(), { width: pageWidth - 62 });
    }

    doc.moveDown(1.0);
    doc.fontSize(10).font("Helvetica").text("Dear Principal Investigator,");
    doc.moveDown(1.0);


    const seruRef = letter.seruNumber || letter.letterNumber || "—";
    const reText = `RE: ${seruRef} - ${(letter.researchTitle || "").toUpperCase()}.`;
    doc.fontSize(10).font("Helvetica-Bold").fillColor(INK)
      .text(reText, leftMargin, doc.y, { width: pageWidth, underline: true, lineGap: 1 });
  
    doc.moveDown(0.9);


    const bodyFn = DECISION_BODY[letter.decision] || DECISION_BODY.revision_requested;
    const bodyText = typeof bodyFn === "function" ? bodyFn(letter) : bodyFn;
    doc.fontSize(10).font("Helvetica").text(bodyText, { width: pageWidth, lineGap: 3, align: "justify" });
    doc.moveDown(0.9);

 
    const label = DECISION_LABEL[letter.decision] || letter.decision;
    doc.fontSize(10).font("Helvetica-Bold").fillColor(decisionColor(letter.decision))
      .text(`Decision: ${label}`, leftMargin, doc.y);
    doc.fillColor(INK);
    doc.moveDown(0.9);


    if (letter.comment) {
      doc.moveTo(leftMargin, doc.y).lineTo(leftMargin + pageWidth, doc.y)
        .lineWidth(0.75).strokeColor("#cccccc").stroke();
      doc.moveDown(0.6);
      doc.fontSize(10).font("Helvetica-Bold").text("Committee Commentary");
      doc.moveDown(0.35);

  
      const cleanComment = String(letter.comment)
        .replace(/\s*Ð\s*/g, "\n\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      doc.fontSize(9.5).font("Helvetica").text(cleanComment, {
        width: pageWidth,
        lineGap: 3,
        align: "justify",
      });
      doc.moveDown(1.2);
    }


    const footerLineY = doc.page.height - doc.page.margins.bottom - 24;
    const SIGNOFF_BLOCK_HEIGHT = 132; 
    if (doc.y + SIGNOFF_BLOCK_HEIGHT > footerLineY) {
      doc.addPage();
    }
    doc.fontSize(10).font("Helvetica").fillColor(INK).text("Yours faithfully,");
    doc.moveDown(2.0);
    doc.font("Helvetica").text("_______________________");
    doc.moveDown(0.25);
    doc.font("Helvetica-Bold").text(letter.signatoryName || "RESEARCH OFFICER,");
    doc.font("Helvetica-Bold").text(letter.signatoryTitle || "SCIENTIFIC AND ETHICS REVIEW UNIT");
    doc.font("Helvetica-Bold").text("NYAHURURU COUNTY REFERRAL HOSPITAL");

    //  Footer 
    const footerY = doc.page.height - doc.page.margins.bottom - 24;
    doc.moveTo(leftMargin, footerY).lineTo(leftMargin + pageWidth, footerY)
      .lineWidth(1).strokeColor(BRAND_BLUE).stroke();
    doc.fontSize(7.5).font("Helvetica-Oblique").fillColor(MUTED)
      .text("In Pursuit of Better Health", leftMargin, footerY + 6, { width: pageWidth, align: "center" });
    doc.fillColor(INK);

    doc.end();
  });
};

function decisionColor(decision) {
  switch (decision) {
    case "approved": return "#1a7f37";
    case "rejected": return "#b42318";
    case "suspended": return "#b42318";
    default: return "#b8860b"; 
  }
}


const mergeWithAttachment = async (letterBuffer, attachmentPath) => {
  let PDFLib;
  try {
    PDFLib = require("pdf-lib");
  } catch {
    console.warn("[decisionLetterPdfService] pdf-lib not installed — skipping merge");
    return letterBuffer;
  }

  try {
    const letterDoc = await PDFLib.PDFDocument.load(letterBuffer);
    const attachmentBytes = await fs.promises.readFile(attachmentPath);
    const attachmentDoc = await PDFLib.PDFDocument.load(attachmentBytes, { ignoreEncryption: true });
    const copiedPages = await letterDoc.copyPages(attachmentDoc, attachmentDoc.getPageIndices());
    copiedPages.forEach((page) => letterDoc.addPage(page));
    return Buffer.from(await letterDoc.save());
  } catch (err) {
    console.error("[decisionLetterPdfService] merge failed:", err.message);
    return letterBuffer;
  }
};

module.exports = { renderDecisionLetterPdf, mergeWithAttachment };