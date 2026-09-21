
"use strict";

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
