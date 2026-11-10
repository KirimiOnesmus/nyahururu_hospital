"use strict";

const app = require("./app");
const logger = require("./utils/logger");
const { init: initSocket } = require("./utils/socket");

const { sequelize } = require("./sequelize/models");


const cron = require("node-cron");
const { run: runResearchExpiryJob } = require("./scripts/researchExpiryJob");

const { run: runReviewerReminderJob } = require("./scripts/reviewerReminderJob");

const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());


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


  initSocket(server, allowedOrigins);

  if (process.env.RESEARCH_EXPIRY_CRON_ENABLED !== "false") {

    cron.schedule("0 7 * * *", () => {
      runResearchExpiryJob({ closeConnection: false }).catch((err) => {
        logger.error({ err }, "Research expiry job failed");
      });
    });
    logger.info("Research expiry job scheduled (daily at 07:00, in-process)");
  } else {
    logger.info(
      "Research expiry job in-process schedule disabled (RESEARCH_EXPIRY_CRON_ENABLED=false) — ensure an external cron is configured.",
    );
  }

  if (process.env.REVIEWER_REMINDER_CRON_ENABLED !== "false") {

    cron.schedule("0 8 * * *", () => {
      runReviewerReminderJob({ closeConnection: false }).catch((err) => {
        logger.error({ err }, "Reviewer reminder job failed");
      });
    });
    logger.info("Reviewer reminder job scheduled (daily at 08:00, in-process)");
  } else {
    logger.info(
      "Reviewer reminder job in-process schedule disabled (REVIEWER_REMINDER_CRON_ENABLED=false) — ensure an external cron is configured.",
    );
  }

  return server;
};


let httpServer = null;
const started = bootstrap().then((s) => {
  httpServer = s;
  return s;
});

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