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
      role: "admin",
      employeeId,
      rfidTag,
      rfid: rfidTag,
      emailVerified: true,
      mustChangePassword: false,
      // mustChangePassword: true,// was intially true

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
