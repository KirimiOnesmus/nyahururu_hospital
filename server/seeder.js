"use strict";

/**
 * Bootstrap script — creates a single superadmin account so the app has
 * a way in on first deploy.
 *
 * Usage:
 *   node seeder.js
 *   npm run db:bootstrap        # once wired into package.json
 *
 * Idempotent: rerunning is safe. Exits early with a message if a
 * superadmin already exists.
 *
 * The temporary password below is intentionally weak because the model
 * flips `mustChangePassword: true`, which means the first login flow
 * forces a reset before any other action succeeds. If you're seeding a
 * production deploy: change SEED_SUPERADMIN_PASSWORD in the env before
 * running.
 */

require("dotenv").config();

const { User, sequelize } = require("./sequelize/models");
const { generateEmployeeId, generateRFID } = require("./utils/generateIds");

const SEED_EMAIL    = process.env.SEED_SUPERADMIN_EMAIL    || "superadmin@ncrh.com";
const SEED_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD || "SuperSecure123!";

const createSuperAdmin = async () => {
  try {
    await sequelize.authenticate();

    // Refuse to seed the well-known default password in production. This
    // mirrors the fail-fast pattern sequelize/config/config.js already uses
    // for DB_PASSWORD — a code comment telling the operator to override it
    // isn't enforcement.
    if (process.env.NODE_ENV === "production" && !process.env.SEED_SUPERADMIN_PASSWORD) {
      console.error(
        "[seeder] Refusing to seed with the default superadmin password in production. " +
        "Set SEED_SUPERADMIN_PASSWORD in the environment and re-run.",
      );
      process.exitCode = 1;
      return;
    }

    const existing = await User.findOne({ where: { role: "superadmin" } });
    if (existing) {
      console.log(` Admin already exists (${existing.email}). Nothing to do.`);
      return;
    }

 
    const employeeId = await generateEmployeeId("superadmin", User);
    const rfidTag = generateRFID(employeeId);


    const superAdmin = await User.create({
      firstName: "Super",
      lastName: "Admin",
      name: "Super Admin",
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      // BUG FIX: this previously created role "admin" while the lookup
      // above checks for role "superadmin" — meaning this script never
      // found its own seeded account and the created user wasn't actually
      // a superadmin at all.
      role: "superadmin",
      employeeId,
      rfidTag,
      rfid: rfidTag,
      emailVerified: true,
      // BUG FIX: this was hardcoded to false, so the temp password never
      // forced a reset on first login regardless of H-3's enforcement.
      mustChangePassword: true,
    });

    console.log(`Super Admin created: ${superAdmin.email}`);
    console.log(`  Temporary password: ${SEED_PASSWORD}`);
    console.log(`  (mustChangePassword=true — change on first login)`);
  } catch (err) {
    console.error("[seeder] failed:", err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

createSuperAdmin();
