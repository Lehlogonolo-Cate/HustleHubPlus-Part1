const mongoose = require('mongoose');

const logger = require('../utils/logger');

// Wraps any query filter built from user input in $eq, which stops operator
// injection such as { "email": { "$ne": null } }
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

const connectDatabase = async (uri, driverOptions = {}) => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, ...driverOptions });
  logger.info('Connected to MongoDB', { event: 'db.connected' });
};

const disconnectDatabase = async () => {
  await mongoose.disconnect();
};

module.exports = { connectDatabase, disconnectDatabase };
