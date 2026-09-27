const mongoose = require('mongoose');

mongoose.set('sanitizeFilter', true);

const connectDatabase = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is missing from the .env file');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
};

module.exports = connectDatabase;