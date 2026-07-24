#!/usr/bin/env node
"use strict";

/**
 * TokenBlacklist maintenance — deletes rows whose blacklist expiry has
 * passed. Safe to delete because once a JWT's own `exp` claim has
 * passed, it's rejected by verify() with TokenExpiredError anyway; the
 * blacklist entry no longer adds any security.
 *
 * Background: on MongoDB we relied on a TTL index to auto-expire
 * blacklisted tokens. MySQL has no equivalent — rows just accumulate.
 * This script exists to be scheduled (e.g. via cron / systemd timer)
 * so the table doesn't grow unbounded.
 *
 * Usage:
 *   node scripts/purgeExpiredTokens.js
 *   npm run maintenance:purge-tokens
 *
 * Suggested cron: nightly at 03:00 UTC
 *   0 3 * * * cd /path/to/server && node scripts/purgeExpiredTokens.js >> /var/log/ncrh/token-purge.log 2>&1
 */

require("dotenv").config();

const { Op } = require("sequelize");
const { TokenBlacklist, sequelize } = require("../sequelize/models");

const run = async () => {
  const startedAt = Date.now();
  try {
    await sequelize.authenticate();

    const deleted = await TokenBlacklist.destroy({
      where: { expiresAt: { [Op.lt]: new Date() } },
    });

    const elapsed = Date.now() - startedAt;
    console.log(
      `[${new Date().toISOString()}] TokenBlacklist purge: ${deleted} row(s) deleted in ${elapsed}ms`,
    );
  } catch (err) {
    console.error(`[${new Date().toISOString()}] purge failed:`, err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
