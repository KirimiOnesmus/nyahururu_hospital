"use strict";

const path = require("path");
const { AppError } = require("./appError");

const { LOCAL_ROOT } = require("../config/storage");
const UPLOADS_ROOT = LOCAL_ROOT;

const resolveUploadPath = (storedPath) => {
  if (!storedPath || typeof storedPath !== "string") {
    throw new AppError("Invalid file path.", 400);
  }

  const trimmed = storedPath.trim();
  if (!trimmed || trimmed.includes("\0")) {
    throw new AppError("Invalid file path.", 400);
  }

  const relative = trimmed
    .replace(/^[/\\]+/, "")
    .replace(/^uploads[/\\]/i, "");

  if (!relative || relative.includes("..") || path.isAbsolute(relative)) {
    throw new AppError("Invalid file path.", 400);
  }

  const resolved = path.resolve(UPLOADS_ROOT, relative);
  const rootWithSep = UPLOADS_ROOT.endsWith(path.sep)
    ? UPLOADS_ROOT
    : UPLOADS_ROOT + path.sep;

  if (resolved !== UPLOADS_ROOT && !resolved.startsWith(rootWithSep)) {
    throw new AppError("Invalid file path.", 400);
  }

  return resolved;
};

module.exports = { resolveUploadPath, UPLOADS_ROOT };
