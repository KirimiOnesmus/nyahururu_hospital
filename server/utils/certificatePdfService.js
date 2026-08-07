const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const LOGO_PATH = path.join(__dirname, "..", "assets", "ncrh-logo.png");

// Theme (research / health)
const NAVY = "#1f3a5f";
const TEAL = "#1a8f7a";
const TEAL_DARK = "#12655a";
const INK = "#334155";
const MUTED = "#64748b";

// Per-stage title + grammar. stageKey is the approved submission's type
// (or "study_closure" for a completion certificate).
const STAGE = {
  initial_proposal: {
    band: "PROPOSAL APPROVAL",
    lead: "has been granted ethical approval to conduct the research study titled:",
    tail:
      "This approval is issued by the Scientific and Ethics Review Unit (SERU) of Nyahururu County Referral Hospital in accordance with national research ethics guidelines and institutional research governance policy.",
  },
  continuing_review: {
    band: "CONTINUING REVIEW (PROGRESS) APPROVAL",
    lead:
      "has been granted continuing approval (annual renewal) for the ongoing research study titled:",
    tail:
      "Having reviewed the annual progress report, the Scientific and Ethics Review Unit (SERU) of Nyahururu County Referral Hospital approves the continuation of this study for the next approval period.",
  },
  study_closure: {
    band: "STUDY CLOSURE APPROVAL",
    lead: "has satisfactorily completed and formally closed the research study titled:",
    tail:
      "The Scientific and Ethics Review Unit (SERU) of Nyahururu County Referral Hospital acknowledges the formal closure of this study, all closure requirements having been met.",
  },
};

const stageConfig = (cert) => {
  if (cert.stageKey && STAGE[cert.stageKey]) return STAGE[cert.stageKey];
  if (cert.type === "ethics_clearance") return STAGE.study_closure;
  return STAGE.initial_proposal;
};

const renderCertificatePdf = (cert) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const stage = stageConfig(cert);
    const seru = cert.researchCode || "\u2014"; // parent SERU number

    // ---- Frame ----
    doc.save();
    doc.rect(0, 0, W, H).fill("#ffffff");
    doc.lineWidth(10).strokeColor(TEAL).rect(18, 18, W - 36, H - 36).stroke();
    doc.lineWidth(1).strokeColor(NAVY).rect(30, 30, W - 60, H - 60).stroke();
    doc.fillColor(NAVY);
    doc.moveTo(18, 18).lineTo(120, 18).lineTo(18, 120).fill();
    doc.fillColor(TEAL_DARK);
    doc.moveTo(W - 18, H - 18).lineTo(W - 120, H - 18).lineTo(W - 18, H - 120).fill();
    doc.restore();

    // ---- Header (centered) ----
    try {
      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, W / 2 - 29, 36, { width: 58, height: 58 });
      }
    } catch {
      /* logo optional */
    }
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(18)
      .text("NYAHURURU COUNTY REFERRAL HOSPITAL", 0, 100, { width: W, align: "center" });
    doc.fillColor(TEAL_DARK).font("Helvetica-Bold").fontSize(11)
      .text("SCIENTIFIC AND ETHICS REVIEW UNIT (SERU)", 0, 122, { width: W, align: "center" });

    // ---- Title ----
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(40)
      .text("RESEARCH CERTIFICATE", 0, 150, { align: "center", characterSpacing: 1 });

    // Stage band
    const bandY = 205, bandW = 380, bandX = (W - bandW) / 2;
    doc.save();
    doc.roundedRect(bandX, bandY, bandW, 26, 13).fill(TEAL);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12)
      .text(stage.band, bandX, bandY + 7, { width: bandW, align: "center", characterSpacing: 1 });
    doc.restore();

    // ---- Body ----
    doc.fillColor(MUTED).font("Helvetica").fontSize(12)
      .text("This is to certify that", 0, 255, { align: "center" });
    doc.fillColor(NAVY).font("Helvetica-BoldOblique").fontSize(30)
      .text(cert.researcherName || "\u2014", 0, 275, { align: "center" });
    const nameW = 360;
    doc.lineWidth(1).strokeColor("#cbd5e1")
      .moveTo((W - nameW) / 2, 320).lineTo((W + nameW) / 2, 320).stroke();
    if (cert.institution) {
      doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(10)
        .text(cert.institution, 0, 326, { align: "center" });
    }
    doc.fillColor(INK).font("Helvetica").fontSize(12)
      .text(stage.lead, 90, 348, { width: W - 180, align: "center" });
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(14)
      .text('\u201C' + (cert.researchTitle || "") + '\u201D', 90, 368, { width: W - 180, align: "center" });

    const sites = Array.isArray(cert.studySites) ? cert.studySites : cert.studySites ? [cert.studySites] : [];
    let cursorY = 368 + doc.heightOfString('"' + (cert.researchTitle || "") + '"', { width: W - 180 }) + 8;
    if (sites.length) {
      doc.fillColor(MUTED).font("Helvetica").fontSize(9.5)
        .text("Study Site(s): " + sites.join(", "), 90, cursorY, { width: W - 180, align: "center" });
      cursorY += 14;
    }
    doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(9.5)
      .text(stage.tail, 110, cursorY, { width: W - 220, align: "center" });

    // ---- Footer ----
    const footY = H - 120;
    doc.fillColor(TEAL_DARK).font("Helvetica-Bold").fontSize(11)
      .text("SERU No: " + seru, 0, footY - 6, { align: "center" });

    const sigY = footY + 30;
    doc.lineWidth(1).strokeColor("#94a3b8");
    doc.moveTo(110, sigY).lineTo(300, sigY).stroke();
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(10)
      .text("CHAIRPERSON, SERU", 110, sigY + 6, { width: 190, align: "center" });

    const issued = cert.publicationDate || cert.validFrom || cert.createdAt || new Date();
    doc.moveTo(W - 300, sigY).lineTo(W - 110, sigY).stroke();
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(10)
      .text(new Date(issued).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
        W - 300, sigY + 6, { width: 190, align: "center" });
    doc.fillColor(MUTED).font("Helvetica").fontSize(8)
      .text("DATE OF ISSUE", W - 300, sigY + 20, { width: 190, align: "center" });

    if (cert.stageKey === "initial_proposal" && cert.validUntil) {
      doc.fillColor(MUTED).font("Helvetica").fontSize(8)
        .text("Valid until " + new Date(cert.validUntil).toLocaleDateString("en-GB"),
          110, sigY + 20, { width: 190, align: "center" });
    }

    if (cert.qrCodeDataUrl) {
      try {
        const base64 = cert.qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
        const qrBuffer = Buffer.from(base64, "base64");
        doc.image(qrBuffer, W / 2 - 28, footY + 18, { width: 56 });
        doc.fillColor(MUTED).fontSize(7)
          .text("Scan to verify", W / 2 - 40, footY + 76, { width: 80, align: "center" });
      } catch {
        /* qr optional */
      }
    }

    doc.end();
  });
};

module.exports = { renderCertificatePdf };
