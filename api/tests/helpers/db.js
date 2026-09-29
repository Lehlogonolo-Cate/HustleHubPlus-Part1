const os = require('os');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { connectDatabase } = require('../../src/config/db');

let mongo;

const startDatabase = async () => {
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  // MongoDB driver 7 loads "os" with a dynamic import(), which Jest's CommonJS sandbox
  // does not support; without it the handshake is sent without client metadata
  await connectDatabase(mongo.getUri('hustlehub-test'), { runtimeAdapters: { os } });
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
};

const clearDatabase = async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
};

const stopDatabase = async () => {
  await mongoose.disconnect();
  await mongo?.stop();
};

module.exports = { startDatabase, clearDatabase, stopDatabase };
