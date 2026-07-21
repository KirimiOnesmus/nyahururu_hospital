const mongoose = require("mongoose");

// H5: staff JWTs had no revocation mechanism — a stolen token stayed valid
// for its full lifetime. Storing the token's jti here on logout, with a
// TTL index that expires the record at the same time the JWT itself would
// have expired, gives us a cheap denylist without needing Redis.
const tokenBlacklistSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
});

tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("TokenBlacklist", tokenBlacklistSchema);
