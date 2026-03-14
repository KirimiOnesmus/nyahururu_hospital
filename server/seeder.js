const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/userModel');
require('dotenv').config();

const connectDB = require('./config/db');

connectDB();

const createSuperAdmin = async () => {
  const existing = await User.findOne({ role: 'superadmin' });
  if (existing) {
    console.log('Super Admin already exists');
    process.exit();
  }

  const hashedPassword = await bcrypt.hash('SuperSecure123!', 10);
  const superAdmin = new User({
    name: 'Super Admin',
    email: 'superadmin@ncrh.com',
    password: hashedPassword,
    role: 'superadmin'
  });

  await superAdmin.save();
  console.log('Super Admin created successfully');
  process.exit();
};

createSuperAdmin();
