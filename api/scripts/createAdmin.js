const { config } = require('../src/config/env');
const { connectDatabase, disconnectDatabase } = require('../src/config/db');
const seedAdmin = require('./seedAdmin');

const run = async () => {
  if (!config.mongoUri) {
    throw new Error('MONGO_URI must be set');
  }

  await connectDatabase(config.mongoUri);

  const { created, email } = await seedAdmin({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
  });

  console.log(created ? `Admin account created for ${email}` : `An account for ${email} already exists - no changes made`);
  await disconnectDatabase();
};

run().catch((error) => {
  console.error(`Could not create admin: ${error.message}`);
  process.exit(1);
});
