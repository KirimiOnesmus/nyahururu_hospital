"use strict";

const { z } = require("zod");

const schema = z.object({
  IMPORT_ENABLED_ENTITIES: z.string().default("services"),
  IMPORT_MAX_FILE_BYTES: z.coerce.number().int().min(1024).max(5 * 1024 * 1024).default(2 * 1024 * 1024),
  IMPORT_BATCH_TTL_HOURS: z.coerce.number().int().min(1).max(72).default(24),
  IMPORT_SNAPSHOT_RETENTION_DAYS: z.coerce.number().int().min(1).max(3650).default(30),
  IMPORT_FRESH_AUTH_MINUTES_T1: z.coerce.number().int().min(1).max(60).default(15),
  IMPORT_RATE_VALIDATE_PER_MIN: z.coerce.number().int().min(1).max(100).default(5),
  IMPORT_RATE_COMMIT_PER_MIN: z.coerce.number().int().min(1).max(100).default(3),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid bulk import configuration: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
}

const config = parsed.data;
config.enabledEntities = new Set(config.IMPORT_ENABLED_ENTITIES.split(",").map((item) => item.trim()).filter(Boolean));
module.exports = Object.freeze(config);
