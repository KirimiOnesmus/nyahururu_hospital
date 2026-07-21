const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('./models/userModel');
require('dotenv').config();

const connectDB = require('./config/db');
const { BCRYPT_SALT_ROUNDS } = require('./constants/authConfig');
const { generateEmployeeId, generateRFID } = require('./utils/generateIds');

connectDB();

const createSuperAdmin = async () => {
  const existing = await User.findOne({ role: 'superadmin' });
  if (existing) {
    console.log('Super Admin already exists');
    process.exit();
  }

  // M6: standardized on bcryptjs (was native `bcrypt`, now removed from
  // package.json — see the backend security review, M6) with the shared
  // configurable work factor.
  const hashedPassword = await bcrypt.hash('SuperSecure123!', BCRYPT_SALT_ROUNDS);
  const employeeId = await generateEmployeeId('superadmin', User);
  const rfidTag = generateRFID(employeeId);

  const superAdmin = new User({
    firstName: 'Super',
    lastName: 'Admin',
    name: 'Super Admin',
    email: 'superadmin@ncrh.com',
    password: hashedPassword,
    role: 'superadmin',
    employeeId,
    rfidTag,
    rfid: rfidTag,
    // Seeded accounts are trusted out-of-band — mark verified directly so
    // this account isn't blocked by the C1 email-verification login gate.
    emailVerified: true,
    mustChangePassword: true,
  });

  await superAdmin.save();
  console.log('Super Admin created successfully. Temporary password: SuperSecure123! (change on first login).');
  process.exit();
};

createSuperAdmin();
