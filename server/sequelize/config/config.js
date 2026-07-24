"use strict";

const path = require("path");
const { loadEnv } = require("./loadEnv");

const nodeEnv = loadEnv(path.resolve(__dirname, "..", ".."));

const REQUIRED_NON_EMPTY = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER"];

function requireNonEmpty(vars) {
  const missing = vars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[FATAL] Missing required database environment variable(s) for NODE_ENV="${nodeEnv}": ${missing.join(", ")}. ` +
        "Check your .env file against .env.example.",
    );
  }
}

requireNonEmpty(REQUIRED_NON_EMPTY);

// DB_PASSWORD must be *defined* (present as a key) in every environment, so
// a completely absent .env still fails fast. An empty string is only
// tolerated in development/test — matching XAMPP's common no-password
// root account for local convenience — never in staging/production, where
// an empty DB password is a real vulnerability, not a dev shortcut.
if (process.env.DB_PASSWORD === undefined) {
  throw new Error(
    `[FATAL] Missing required database environment variable for NODE_ENV="${nodeEnv}": DB_PASSWORD. ` +
      "Set it (an empty string is only acceptable in development/test) in your .env file.",
  );
}
if (process.env.DB_PASSWORD === "" && !["development", "test"].includes(nodeEnv)) {
  throw new Error(
    `[FATAL] DB_PASSWORD is empty for NODE_ENV="${nodeEnv}". ` +
      "An empty database password is only permitted in development/test environments.",
  );
}

const toBool = (value, fallback) => {
  if (value === undefined || value === "") return fallback;
  return value.toLowerCase() === "true";
};

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

// Shared base — every environment connects to MySQL the same way. Only
// pool sizing, SSL enforcement, and logging verbosity differ by env, and
// those differences are themselves environment-driven (not hardcoded
// per-environment values baked into this file).
const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: toInt(process.env.DB_PORT, 3306),
  dialect: "mysql",
  charset: "utf8mb4",
  collate: "utf8mb4_unicode_ci",
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
    underscored: true, // snake_case columns in MySQL, camelCase in JS models
    timestamps: true,
  },
  pool: {
    max: toInt(process.env.DB_POOL_MAX, 10),
    min: toInt(process.env.DB_POOL_MIN, 0),
    acquire: toInt(process.env.DB_POOL_ACQUIRE_MS, 30000),
    idle: toInt(process.env.DB_POOL_IDLE_MS, 10000),
  },
  dialectOptions: {
    // DB_SSL defaults to false for local XAMPP dev, but should be set to
    // true (with a real CA) for staging/production MySQL hosts that
    // require TLS. Never disable cert verification implicitly.
    ...(toBool(process.env.DB_SSL, false)
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: toBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
          },
        }
      : {}),
  },
  timezone: process.env.DB_TIMEZONE || "+00:00",
  logging: toBool(process.env.DB_LOGGING, nodeEnv === "development") ? console.log : false,
};

module.exports = {
  development: { ...base },
  test: { ...base, logging: false },
  staging: { ...base },
  production: {
    ...base,
    logging: false,
    dialectOptions: { ...base.dialectOptions },
  },
};

// Production MySQL connections must be encrypted. If DB_SSL wasn't
// explicitly set to true while actually running as production, fail fast
// rather than silently connecting in plaintext. Guarded by nodeEnv (not
// just presence of the "production" key above) so requiring this file in
// development/test never trips over production's own requirements.
if (nodeEnv === "production" && !toBool(process.env.DB_SSL, false)) {
  throw new Error(
    '[FATAL] DB_SSL must be set to "true" when NODE_ENV=production. ' +
      "Refusing to start with an unencrypted production database connection.",
  );
}
