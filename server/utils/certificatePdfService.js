const PDFDocument = require("pdfkit");
const path = require("path");
const fs   = require("fs");


const renderCertificatePdf = (cert) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const isClearance = cert.type === "clearance";

    // Border
    doc.lineWidth(2).rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

    // Header
    doc.fontSize(22).font("Helvetica-Bold").text("NYAHURURU COUNTY REFERRAL HOSPITAL", { align: "center" });
    doc.fontSize(16).font("Helvetica").text(
      isClearance ? "Research Ethics Clearance Certificate" : "Certificate of Research Completion",
      { align: "center" }
    );
    doc.moveDown(1.5);

    doc.fontSize(11).font("Helvetica-Bold").text(`Certificate Number: ${cert.certificateNumber}`, { align: "center" });
    if (cert.researchCode) {
      doc.fontSize(11).font("Helvetica").text(`Research Code: ${cert.researchCode}`, { align: "center" });
    }
    doc.moveDown(1);

    doc.fontSize(12).font("Helvetica").text("This is to certify that", { align: "center" });
    doc.fontSize(16).font("Helvetica-Bold").text(cert.researcherName, { align: "center" });
    if (cert.institution) {
      doc.fontSize(11).font("Helvetica-Oblique").text(cert.institution, { align: "center" });
    }
    doc.moveDown(0.5);

    doc.fontSize(12).font("Helvetica").text(
      isClearance
        ? `has received ethics clearance for the research study titled:`
        : `has successfully completed the research study titled:`,
      { align: "center" }
    );
    doc.fontSize(13).font("Helvetica-Bold").text(`"${cert.researchTitle}"`, { align: "center" });
    doc.moveDown(1);

    if (cert.studySites?.length) {
      doc.fontSize(10).font("Helvetica").text(`Study Site(s): ${cert.studySites.join(", ")}`, { align: "center" });
    }

    if (isClearance && cert.validFrom && cert.validUntil) {
      doc.fontSize(10).text(
        `Valid from ${cert.validFrom.toDateString()} to ${cert.validUntil.toDateString()}`,
        { align: "center" }
      );
    }
    if (!isClearance && cert.publicationDate) {
      doc.fontSize(10).text(`Published: ${cert.publicationDate.toDateString()}`, { align: "center" });
      if (cert.journalName) doc.text(`Journal: ${cert.journalName}`, { align: "center" });
    }

    doc.moveDown(1);
    const statement = isClearance ? cert.committeeApprovalStatement : cert.completionStatement;
    if (statement) {
      doc.fontSize(10).font("Helvetica-Oblique").text(statement, { align: "center", width: 500 });
    }

    // Signature + seal area (bottom)
    const bottomY = doc.page.height - 140;
    doc.fontSize(10).font("Helvetica");
    doc.text("_______________________", 100, bottomY, { align: "left" });
    doc.text(cert.signatureAreaLabel || "Authorized Signatory", 100, bottomY + 15);

    // QR code (embed base64 PNG)
    if (cert.qrCodeDataUrl) {
      const base64 = cert.qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
      const qrBuffer = Buffer.from(base64, "base64");
      doc.image(qrBuffer, doc.page.width - 200, bottomY - 20, { width: 90 });
      doc.fontSize(8).text("Scan to verify", doc.page.width - 200, bottomY + 75, { width: 90, align: "center" });
    }

    doc.end();
  });
};

module.exports = { renderCertificatePdf };