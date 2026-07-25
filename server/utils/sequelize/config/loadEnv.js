"use strict";

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

/**
 * Loads environment variables with environment-specific overrides.
 *
 * Resolution order (first match wins per variable, dotenv never overwrites
 * a variable that is already set in process.env — e.g. by the host/CI/PM2):
 *   1. .env.<NODE_ENV>.local   (untracked, machine-specific secrets)
 *   2. .env.<NODE_ENV>         (checked-in, non-secret defaults per env)
 *   3. .env                    (shared fallback, used in plain local dev)
 *
 * This lets development/test/staging/production each have their own config
 * without ever hardcoding secrets or mixing dev settings into prod.
 */
function loadEnv(rootDir) {
  const nodeEnv = process.env.NODE_ENV || "development";

  const candidates = [
    `.env.${nodeEnv}.local`,
    `.env.${nodeEnv}`,
    ".env",
  ];

  for (const file of candidates) {
    const fullPath = path.resolve(rootDir, file);
    if (fs.existsSync(fullPath)) {
      dotenv.config({ path: fullPath });
    }
  }

  return nodeEnv;
}

module.exports = { loadEnv };
