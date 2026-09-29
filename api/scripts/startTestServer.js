// Starts the real API against a throwaway in-memory MongoDB with a seeded admin.
// Used to run the Postman/Newman suite locally and in CI without touching Atlas.
const crypto = require('crypto');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://placeholder';
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@hustlehub.test';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@Passw0rd!';
// The Postman suite performs many logins in one run; the real limit is tested by Jest
process.env.RATE_LIMIT_AUTH = process.env.RATE_LIMIT_AUTH || '100';
process.env.LOG_DIR = process.env.LOG_DIR || require('path').join(__dirname, '..', 'logs', 'test-server');

const { startServer } = require('../src/server');
const seedAdmin = require('./seedAdmin');

const run = async () => {
  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await startServer({ mongoUri: mongo.getUri('hustlehub-test') });

  await seedAdmin({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  console.log(`Test server ready. Admin login: ${process.env.ADMIN_EMAIL}`);

  const stop = async () => {
    await mongo.stop();
  };
  process.once('exit', stop);
};

run().catch((error) => {
  console.error(`Test server failed to start: ${error.message}`);
  process.exit(1);
});
