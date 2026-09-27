require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDatabase = require('../config/db');
const User = require('../models/User');

const createAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in the .env file first');
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 12) {
    console.error('ADMIN_PASSWORD must be at least 12 characters');
    process.exit(1);
  }

  await connectDatabase();

  const email = ADMIN_EMAIL.toLowerCase();
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    console.log('An account with this email already exists - no changes made');
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await User.create({
      name: ADMIN_NAME || 'Platform Admin',
      email,
      passwordHash,
      role: 'admin'
    });

    console.log(`Admin account created for ${email}`);
  }

  await mongoose.disconnect();
};

createAdmin().catch((error) => {
  console.error('Could not create admin:', error.message);
  process.exit(1);
});