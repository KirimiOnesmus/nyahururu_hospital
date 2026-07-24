"use strict";

const app = require("./app");
const logger = require("./utils/logger");

// Load the Sequelize instance + all models. Requiring the module at boot
// exercises every model's define() call, so any model-definition error
// (bad ENUM, typo in a hook, missing FK target) surfaces here rather
// than on the first request that touches the offending model.
const { sequelize } = require("./sequelize/models");

const PORT = process.env.PORT || 5000;

/**
 * Boot sequence:
 *   1. Authenticate against MySQL. Hard-fail on error — the app cannot
 *      serve traffic without its primary datastore.
 *   2. app.listen().
 */
const bootstrap = async () => {
  try {
    await sequelize.authenticate();
    logger.info(
      { dialect: sequelize.getDialect(), database: sequelize.config.database },
      "MySQL (Sequelize) connected",
    );
  } catch (err) {
    logger.error({ err }, "Failed to connect to MySQL — refusing to start");
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(
      `Server is running on port ${PORT} (${process.env.NODE_ENV || "development"})`,
    );
  });

  return server;
};

// Kick things off. Keep the returned promise so we can attach shutdown
// handlers to whichever server instance boot produces.
let httpServer = null;
const started = bootstrap().then((s) => {
  httpServer = s;
  return s;
});

/**
 * Graceful shutdown — drains in-flight requests before closing DB
 * connections. Force-exits after 10s if a request never resolves,
 * which keeps deploy/restart cycles bounded.
 */
const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  started.then(async () => {
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    try {
      await sequelize.close();
      logger.info("Sequelize (MySQL) connection closed");
    } catch (err) {
      logger.error({ err }, "Error closing Sequelize connection");
    }
    logger.info("Shutdown complete.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (err) => {
  logger.error({ err }, "Unhandled Promise Rejection");
  if (httpServer) httpServer.close(() => process.exit(1));
  else process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception");
  process.exit(1);
});
