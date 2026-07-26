"use strict";

const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

module.exports = {
  BCRYPT_SALT_ROUNDS,
  MAX_FAILED_LOGIN_ATTEMPTS,
  LOCK_DURATION_MS,
};
