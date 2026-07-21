const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB connected");
  } catch (error) {
    // Low-hardening note from the security review: previously this
    // swallowed the actual error message, making ops debugging much
    // harder. Now logs the real error (to logs only, never to a client).
    logger.error({ err: error }, "Failed to connect to MongoDB");
    process.exit(1);
  }
};

module.exports = connectDB;
