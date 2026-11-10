"use strict";



require("dotenv").config();

const { User, sequelize } = require("./sequelize/models");
const { generateEmployeeId, generateRFID } = require("./utils/generateIds");

const SEED_EMAIL    = process.env.SEED_SUPERADMIN_EMAIL    || "superadmin@ncrh.com";
const SEED_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD || "SuperSecure123!";

const createSuperAdmin = async () => {
  try {
    await sequelize.authenticate();

 
    if (process.env.NODE_ENV !== "development" && !process.env.SEED_SUPERADMIN_PASSWORD) {
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
      role: "admin",
      employeeId,
      rfidTag,
      rfid: rfidTag,
      emailVerified: true,

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
