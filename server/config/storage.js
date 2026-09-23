"use strict";

const path = require("path");

const DRIVER = (process.env.STORAGE_DRIVER || "local").toLowerCase();

const LOCAL_ROOT = path.resolve(
  process.env.UPLOAD_ROOT || path.join(__dirname, "..", "uploads"),
);

const PUBLIC_BASE_URL = (process.env.STORAGE_PUBLIC_URL || "").replace(/\/$/, "");

const getLocalDir = (folderName) => path.join(LOCAL_ROOT, folderName);

const toPublicUrl = (storedPath) => {
  if (!storedPath) return storedPath;
  if (/^https?:\/\//i.test(storedPath)) return storedPath;
  const relative = storedPath.replace(/^\/+/, "").replace(/^uploads[/\\]/, "");
  if (PUBLIC_BASE_URL) return `${PUBLIC_BASE_URL}/${relative.replace(/\\/g, "/")}`;
  return `/uploads/${relative.replace(/\\/g, "/")}`;
};

module.exports = {
  DRIVER,
  LOCAL_ROOT,
  PUBLIC_BASE_URL,
  getLocalDir,
  toPublicUrl,
  remote: {
    s3: {
      bucket: process.env.S3_BUCKET || "",
      region: process.env.S3_REGION || "",
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
      apiKey: process.env.CLOUDINARY_API_KEY || "",
      apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    },
  },
};
