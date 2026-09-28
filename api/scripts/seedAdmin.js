const bcrypt = require('bcryptjs');

const { config } = require('../src/config/env');
const { ROLES } = require('../src/constants');
const User = require('../src/models/User');

// Admin accounts cannot be created through the public API, only with this server-side script
const seedAdmin = async ({ name = 'Platform Admin', email, password }) => {
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters');
  }

  const normalisedEmail = email.trim().toLowerCase();

  if (await User.exists({ email: normalisedEmail })) {
    return { created: false, email: normalisedEmail };
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  await User.create({ name, email: normalisedEmail, passwordHash, role: ROLES.ADMIN });
  return { created: true, email: normalisedEmail };
};

module.exports = seedAdmin;
