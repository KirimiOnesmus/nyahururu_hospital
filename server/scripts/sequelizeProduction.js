"use strict";

const { spawnSync } = require("node:child_process");

const command = process.argv[2] || "db:migrate";
const allowedCommands = new Set(["db:migrate", "db:migrate:status"]);

if (!allowedCommands.has(command)) {
  console.error(`Unsupported production migration command: ${command}`);
  process.exit(2);
}

const sequelizeCli = require.resolve("sequelize-cli/lib/sequelize");
const result = spawnSync(
  process.execPath,
  [sequelizeCli, command, "--env", "production"],
  {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  },
);

if (result.error) {
  console.error("Could not start Sequelize CLI:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
