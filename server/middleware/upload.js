const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { AppError, asyncHandler } = require("../utils/appError");

// Allowed types per upload context — extend per stage per the research spec

const IMAGE_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];
const IMAGE_EXTS  = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];

const VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
const VIDEO_EXTS  = [".mp4", ".webm", ".mov", ".avi"];

const PDF_MIMES   = ["application/pdf"];
const DOC_MIMES   = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
  "application/zip",
];

const ALLOWED_MIME_TYPES = {
  //  Research pipeline (original) 
  research:    PDF_MIMES,
  proposal:    PDF_MIMES,
  progress:    DOC_MIMES,
  final_paper: [...DOC_MIMES, "text/plain"],

  // Chair's change #3: study-closure closeout report upload.
  closure:         DOC_MIMES,
  // Chair's change #6: reviewer/committee feedback attachments.
  "review-feedback": DOC_MIMES,

  //  Content / CMS modules 
  news:        IMAGE_MIMES,
  events:      IMAGE_MIMES,
  gallery:     [...IMAGE_MIMES, ...VIDEO_MIMES],
  services:    IMAGE_MIMES,
  notices:     [...PDF_MIMES, ...IMAGE_MIMES],
  tenders:     PDF_MIMES,
  reports:     [...PDF_MIMES, ...DOC_MIMES],

  //  Generic image context (profile photos etc.) 
  images:      IMAGE_MIMES,
};

const ALLOWED_EXTENSIONS = {
  research:    [".pdf"],
  proposal:    [".pdf"],
  progress:    [".pdf", ".docx", ".csv", ".xls", ".xlsx", ".zip"],
  final_paper: [".pdf", ".docx", ".csv", ".xls", ".xlsx", ".zip", ".r", ".py", ".do", ".sps", ".txt"],

  closure:           [".pdf", ".docx", ".csv", ".xls", ".xlsx", ".zip"],
  "review-feedback": [".pdf", ".docx", ".csv", ".xls", ".xlsx", ".zip"],

  news:        IMAGE_EXTS,
  events:      IMAGE_EXTS,
  gallery:     [...IMAGE_EXTS, ...VIDEO_EXTS],
  services:    IMAGE_EXTS,
  notices:     [".pdf", ...IMAGE_EXTS],
  tenders:     [".pdf"],
  reports:     [".pdf", ".docx", ".csv", ".xls", ".xlsx", ".zip"],

  images:      IMAGE_EXTS,
};

const MAX_FILE_SIZE = {
  research:    20 * 1024 * 1024,
  proposal:    20 * 1024 * 1024,
  progress:    50 * 1024 * 1024, 
  final_paper: 50 * 1024 * 1024,

  closure:           50 * 1024 * 1024,
  "review-feedback": 50 * 1024 * 1024,

  news:        10 * 1024 * 1024,
  events:      10 * 1024 * 1024,
  gallery:    100 * 1024 * 1024, 
  services:    10 * 1024 * 1024,
  notices:     10 * 1024 * 1024,
  tenders:     20 * 1024 * 1024,
  reports:     50 * 1024 * 1024,

  images:       5 * 1024 * 1024,
};

const createFileFilter = (folder) => (req, file, cb) => {
  const allowedMimes = ALLOWED_MIME_TYPES[folder] || ALLOWED_MIME_TYPES.research;
  const allowedExts  = ALLOWED_EXTENSIONS[folder] || ALLOWED_EXTENSIONS.research;
  const ext = path.extname(file.originalname).toLowerCase();


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


const SIGNATURES = {
  ".pdf": [[0x25, 0x50, 0x44, 0x46]], 
  ".docx": [[0x50, 0x4b, 0x03, 0x04]],
  ".xlsx": [[0x50, 0x4b, 0x03, 0x04]],
  ".zip": [[0x50, 0x4b, 0x03, 0x04]],
  ".xls": [[0xd0, 0xcf, 0x11, 0xe0]], 
  ".jpg": [[0xff, 0xd8, 0xff]],
  ".jpeg": [[0xff, 0xd8, 0xff]],
  ".png": [[0x89, 0x50, 0x4e, 0x47]],
  ".webp": [[0x52, 0x49, 0x46, 0x46]],
  ".gif": [[0x47, 0x49, 0x46, 0x38]], 
  ".mp4": [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]], 
  ".webm": [[0x1a, 0x45, 0xdf, 0xa3]], 
  ".mov": [[0x00, 0x00, 0x00]],         
  ".avi": [[0x52, 0x49, 0x46, 0x46]],  
};


const MAGIC_BYTE_SKIP = new Set([".avif"]);

const TEXT_LIKE_EXTENSIONS = new Set([".csv", ".txt", ".r", ".py", ".do", ".sps"]);

const matchesSignature = (buffer, sigList) =>
  sigList.some((sig) => sig.every((byte, i) => buffer[i] === byte));

const looksLikeDisguisedPayload = (buffer) => {
  const head = buffer.slice(0, 512).toString("utf8", 0, Math.min(512, buffer.length)).toLowerCase();
  if (buffer.slice(0, 2).toString("latin1") === "MZ") return true;
  if (buffer.slice(0, 4).toString("latin1") === "\x7fELF") return true; 
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
        if (MAGIC_BYTE_SKIP.has(ext)) {

          valid = true;
        } else if (TEXT_LIKE_EXTENSIONS.has(ext)) {
          valid = !looksLikeDisguisedPayload(head);
        } else if (ext === ".webp") {
          valid =
            head.slice(0, 4).toString("latin1") === "RIFF" &&
            head.slice(8, 12).toString("latin1") === "WEBP";
        } else if (ext === ".avi") {
          valid =
            head.slice(0, 4).toString("latin1") === "RIFF" &&
            head.slice(8, 12).toString("latin1") === "AVI ";
        } else if (ext === ".mp4" || ext === ".mov") {
        
          valid =
            head.slice(4, 8).toString("latin1") === "ftyp" ||
            head.slice(0, 3).equals(Buffer.from([0x00, 0x00, 0x00]));
        } else if (SIGNATURES[ext]) {
          valid = matchesSignature(head, SIGNATURES[ext]);
        } else {
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