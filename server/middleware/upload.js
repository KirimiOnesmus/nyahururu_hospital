const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { AppError } = require("../utils/appError");

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

  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE[folderName] || MAX_FILE_SIZE.research },
    fileFilter: createFileFilter(folderName),
  });
};

module.exports = createUploader;
module.exports.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;
module.exports.ALLOWED_EXTENSIONS = ALLOWED_EXTENSIONS;