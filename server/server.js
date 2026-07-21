"use strict";

const mongoose = require("mongoose");
const app = require("./app");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// M5: previously there was no graceful shutdown and no process-level
// safety net — an unhandled rejection anywhere would crash the process
// ungracefully, and a deploy/restart would kill in-flight requests and the
// Mongo connection abruptly instead of draining them.
const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      logger.info("HTTP server and MongoDB connection closed.");
      process.exit(0);
    });
  });

  // Force-exit if graceful shutdown hangs (e.g. a request never resolves).
  setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (err) => {
  logger.error({ err }, "Unhandled Promise Rejection");
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception");
  process.exit(1);
});
