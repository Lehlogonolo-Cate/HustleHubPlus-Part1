// Runs before every test file, before any application module is loaded
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-signing-0123456789';
process.env.MONGO_URI = 'mongodb://set-by-test-helper';
process.env.USE_HTTPS = 'false';
process.env.BCRYPT_ROUNDS = '4';
process.env.RATE_LIMIT_GENERAL = process.env.RATE_LIMIT_GENERAL || '10000';
process.env.RATE_LIMIT_AUTH = process.env.RATE_LIMIT_AUTH || '10000';
process.env.RATE_LIMIT_BOOKING = process.env.RATE_LIMIT_BOOKING || '10000';
