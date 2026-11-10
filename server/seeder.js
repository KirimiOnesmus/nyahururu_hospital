"use strict";



require("dotenv").config();

const { User, GalleryCategory, sequelize } = require("./sequelize/models");
const { generateEmployeeId, generateRFID } = require("./utils/generateIds");
const { HOMEPAGE_BANNER_CATEGORY } = require("./constants/gallery");

const OWNER_ADMIN_EMAIL =
  process.env.SEED_SUPERADMIN_EMAIL ||
  "kiongozi@ncrh.com";
const configuredOwnerAdminEmail = process.env.SEED_SUPERADMIN_EMAIL;
const OWNER_ADMIN_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD;

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

const createAdminAccounts = async () => {
  try {
    await sequelize.authenticate();

    await GalleryCategory.findOrCreate({
      where: { name: HOMEPAGE_BANNER_CATEGORY },
      defaults: {
        name: HOMEPAGE_BANNER_CATEGORY,
        description: "Background images for the homepage carousel",
        order: 0,
        active: true,
      },
    });
    console.log(`[seeder] built-in gallery category is ready: ${HOMEPAGE_BANNER_CATEGORY}`);

    const isProduction = process.env.NODE_ENV !== "development";
    if (
      isProduction &&
      (!configuredOwnerAdminEmail || !OWNER_ADMIN_PASSWORD || !ADMIN_EMAIL || !ADMIN_PASSWORD)
    ) {
      console.error(
        "[seeder] Production seeding requires SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, " +
          "SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD.",
      );
      process.exitCode = 1;
      return;
    }

    if (ADMIN_EMAIL && OWNER_ADMIN_EMAIL.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      throw new Error("Owner and admin accounts must use different email addresses.");
    }
    if (ADMIN_PASSWORD && OWNER_ADMIN_PASSWORD === ADMIN_PASSWORD) {
      throw new Error("Owner and  admin accounts must use different passwords.");
    }

    const accounts = [
      {
        label: "Owner admin",
        firstName: "Hospital",
        lastName: "Admin",
        email: OWNER_ADMIN_EMAIL,
        password: OWNER_ADMIN_PASSWORD || "SuperSecure123!",
      },
      ...(ADMIN_EMAIL && ADMIN_PASSWORD
        ? [{
            label: "Admin",
            firstName: "Admin",
            lastName: "User",
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
          }]
        : []),
    ];

    for (const account of accounts) {
      const existing = await User.findOne({ where: { email: account.email } });
      if (existing) {
        if (existing.role === "superadmin") {
          await existing.update({ role: "admin", mustChangePassword: true });
          console.log(`${account.label} account downgraded from superadmin to admin (${existing.email}).`);
          continue;
        }
        if (existing.role !== "admin") {
          throw new Error(
            `${account.label} email ${existing.email} already belongs to role "${existing.role}". ` +
              "Choose a different seed email or promote the account separately.",
          );
        }
        console.log(`${account.label} account already exists (${existing.email}); skipping.`);
        continue;
      }

      const employeeId = await generateEmployeeId("admin", User);
      const rfidTag = generateRFID(employeeId);

      const admin = await User.create({
        firstName: account.firstName,
        lastName: account.lastName,
        name: `${account.firstName} ${account.lastName}`,
        email: account.email,
        password: account.password,
        role: "admin",
        employeeId,
        rfidTag,
        rfid: rfidTag,
        emailVerified: true,
        mustChangePassword: false,
      });

      console.log(`${account.label} account created: ${admin.email}`);
      console.log("  Its password must be changed on first login.");
    }
  } catch (err) {
    console.error("[seeder] failed:", err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

createAdminAccounts();
