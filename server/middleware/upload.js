const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { AppError } = require("../utils/appError");

const ALLOWED_MIME_TYPES = {
  research: ["application/pdf"],
  images: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

//CLOUD STORAGE
const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), "uploads", folder);
      fs.mkdirSync(dir, { recursive: true });
    },
    filename: (req, file, cb) => {
      //Randowmize File name
      const ext = path.extname(file.originalname).toLowerCase();
      const random = crypto.randomBytes(16).toString("hex");
      cb(null, `${random}${ext}`);
    },
  });

const createFileFilter = (folder) => (req, file, cb) => {
  const allowed = ALLOWED_MIME_TYPES[folder] || ALLOWED_MIME_TYPES.research;

  if (!allowed.includes(file.mimetype)) {
    return cb(
      new AppError(
        `Invalid file type '${file.mimetype}'. Allowed:${allowed.join(", ")}`,
        400,
      ),
      false,
    );
  }
  if (folder === "research") {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext !== ".pdf") {
      return cb(
        new AppError(
          "Only PDF files are accepted for research submissions.",
          400,
        ),
        false,
      );
    }
  }
  cb(null, true);
};




//LOCAL STORAGE
const createUploader = (folderName) => {
  const uploadDir = path.join(__dirname, `../uploads/${folderName}`);

  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueName + path.extname(file.originalname));
    },
  });

  return multer({ storage });
};

module.exports = createUploader;
