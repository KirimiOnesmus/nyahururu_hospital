const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { AppError, asyncHandler } = require("../utils/appError");

// Allowed types per upload context — extend per stage per the research spec
const ALLOWED_MIME_TYPES = {
  research: ["application/pdf"], 
  proposal: ["application/pdf"],
  progress: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/zip",
  ],
  final_paper: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "text/plain", 
  ],
  images: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

const ALLOWED_EXTENSIONS = {
  research:    [".pdf"],
  proposal:    [".pdf"],
  progress:    [".pdf", ".docx", ".csv", ".xls", ".xlsx", ".zip"],
  final_paper: [".pdf", ".docx", ".csv", ".xls", ".xlsx", ".zip", ".r", ".py", ".do", ".sps", ".txt"],
  images:      [".jpg", ".jpeg", ".png", ".webp"],
};

const MAX_FILE_SIZE = {
  research:    20 * 1024 * 1024,
  proposal:    20 * 1024 * 1024,
  progress:    50 * 1024 * 1024, // datasets/statistical outputs run larger
  final_paper: 50 * 1024 * 1024,
  images:       5 * 1024 * 1024,
};

const createFileFilter = (folder) => (req, file, cb) => {
  const allowedMimes = ALLOWED_MIME_TYPES[folder] || ALLOWED_MIME_TYPES.research;
  const allowedExts  = ALLOWED_EXTENSIONS[folder] || ALLOWED_EXTENSIONS.research;
  const ext = path.extname(file.originalname).toLowerCase();

  // Require BOTH mimetype and extension to match — mimetype alone is spoofable

  if (!allowedMimes.includes(file.mimetype) || !allowedExts.includes(ext)) {
    return cb(
      new AppError(
        `Invalid file type "${file.originalname}". Allowed for ${folder}: ${allowedExts.join(", ")}.`,
        400
      ),
      false
    );
  }
  cb(null, true);
};

//  LOCAL STORAGE (per-folder, randomized filenames)

const createUploader = (folderName) => {
  const uploadDir = path.join(__dirname, `../uploads/${folderName}`);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const random = crypto.randomBytes(16).toString("hex");
      cb(null, `${random}${ext}`);
    },
  });

  const uploader = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE[folderName] || MAX_FILE_SIZE.research },
    fileFilter: createFileFilter(folderName),
  });

  // H7: every existing call site (`someUploader.single(...)`,
  // `.array(...)`, `.fields(...)`, `.any()`) is used directly as Express
  // route middleware. Express flattens middleware arrays, so returning
  // [multerMiddleware, verifyMagicBytes()] here instead of the bare multer
  // middleware retrofits magic-byte validation onto every upload route in
  // the app without touching any of the 10 route files that call these.
  return {
    single: (field) => [uploader.single(field), verifyMagicBytes()],
    array: (field, max) => [uploader.array(field, max), verifyMagicBytes()],
    fields: (fieldsConfig) => [uploader.fields(fieldsConfig), verifyMagicBytes()],
    any: () => [uploader.any(), verifyMagicBytes()],
  };
};

module.exports = createUploader;
module.exports.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;
module.exports.ALLOWED_EXTENSIONS = ALLOWED_EXTENSIONS;

// H7: mimetype/extension checks above only look at what the client
// *claims* the file is — trivially spoofable (rename a .html payload to
// .pdf, or set Content-Type: application/pdf on anything). This reads the
// first bytes actually written to disk and checks them against known file
// signatures before the upload is accepted; on mismatch the file is
// deleted and the request rejected.
//
// Signature table only covers formats this app actually allows (see
// ALLOWED_MIME_TYPES above) — text-ish types (csv/txt) don't have a fixed
// magic number, so those are instead checked for embedded HTML/script/
// executable markers in the first bytes, which is what a disguised-payload
// attack would need to include to do anything on download.
const SIGNATURES = {
  ".pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  ".docx": [[0x50, 0x4b, 0x03, 0x04]], // PK.. (zip container)
  ".xlsx": [[0x50, 0x4b, 0x03, 0x04]],
  ".zip": [[0x50, 0x4b, 0x03, 0x04]],
  ".xls": [[0xd0, 0xcf, 0x11, 0xe0]], // legacy OLE compound doc
  ".jpg": [[0xff, 0xd8, 0xff]],
  ".jpeg": [[0xff, 0xd8, 0xff]],
  ".png": [[0x89, 0x50, 0x4e, 0x47]],
  ".webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF (WEBP confirmed at offset 8, checked separately)
};

const TEXT_LIKE_EXTENSIONS = new Set([".csv", ".txt", ".r", ".py", ".do", ".sps"]);

const matchesSignature = (buffer, sigList) =>
  sigList.some((sig) => sig.every((byte, i) => buffer[i] === byte));

const looksLikeDisguisedPayload = (buffer) => {
  const head = buffer.slice(0, 512).toString("utf8", 0, Math.min(512, buffer.length)).toLowerCase();
  if (buffer.slice(0, 2).toString("latin1") === "MZ") return true; // Windows PE executable
  if (buffer.slice(0, 4).toString("latin1") === "\x7fELF") return true; // Linux ELF binary
  return (
    head.includes("<script") ||
    head.includes("<?php") ||
    head.includes("<html") ||
    head.startsWith("#!/")
  );
};

const verifyMagicBytes = () =>
  asyncHandler(async (req, res, next) => {
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) return next();

    try {
      for (const file of files) {
        const ext = path.extname(file.originalname).toLowerCase();
        const fd = fs.openSync(file.path, "r");
        const buffer = Buffer.alloc(512);
        const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
        fs.closeSync(fd);
        const head = buffer.slice(0, bytesRead);

        let valid;
        if (TEXT_LIKE_EXTENSIONS.has(ext)) {
          valid = !looksLikeDisguisedPayload(head);
        } else if (ext === ".webp") {
          valid =
            head.slice(0, 4).toString("latin1") === "RIFF" &&
            head.slice(8, 12).toString("latin1") === "WEBP";
        } else if (SIGNATURES[ext]) {
          valid = matchesSignature(head, SIGNATURES[ext]);
        } else {
          // Unknown extension for this app's allowlist — fail closed.
          valid = false;
        }

        if (!valid) {
          fs.unlink(file.path, () => {});
          return next(
            new AppError(
              `File "${file.originalname}" does not match its declared type. Upload rejected.`,
              400
            )
          );
        }
      }
      next();
    } catch (err) {
      files.forEach((f) => fs.unlink(f.path, () => {}));
      next(err);
    }
  });

module.exports.verifyMagicBytes = verifyMagicBytes;