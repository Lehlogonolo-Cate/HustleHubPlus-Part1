const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const nodeEnv = process.env.NODE_ENV || 'development';

const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  appName: process.env.APP_NAME || 'HustleHub+',
  port: toInt(process.env.PORT, 4000),
  useHttps: process.env.USE_HTTPS !== 'false',
  certDir: process.env.CERT_DIR || path.join(__dirname, '..', '..', 'certs'),
  // Only set this when the API sits behind a proxy we control (e.g. nginx in Docker)
  trustProxy: toInt(process.env.TRUST_PROXY, 0),
  clientOrigins: (process.env.CLIENT_ORIGIN || 'https://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGO_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    issuer: 'HustleHub+',
    audience: 'HustleHub+ users'
  },
  bcryptRounds: toInt(process.env.BCRYPT_ROUNDS, 12),
  lockout: {
    maxAttempts: toInt(process.env.LOCKOUT_MAX_ATTEMPTS, 5),
    durationMinutes: toInt(process.env.LOCKOUT_DURATION_MINUTES, 15)
  },
  rateLimits: {
    windowMinutes: toInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 15),
    general: toInt(process.env.RATE_LIMIT_GENERAL, 300),
    auth: toInt(process.env.RATE_LIMIT_AUTH, 10),
    booking: toInt(process.env.RATE_LIMIT_BOOKING, 20)
  },
  platformFeeRate: Number(process.env.PLATFORM_FEE_RATE || 0.1),
  logLevel: process.env.LOG_LEVEL || (nodeEnv === 'production' ? 'info' : 'debug'),
  logDir: process.env.LOG_DIR || path.join(__dirname, '..', '..', 'logs')
};

// Fail fast on insecure or missing configuration instead of running half-configured
const validateConfig = () => {
  const problems = [];

  if (!config.mongoUri) {
    problems.push('MONGO_URI is required');
  }

  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    problems.push('JWT_SECRET is required and must be at least 32 characters');
  }

  if (config.jwt.secret === 'replace_with_your_secret') {
    problems.push('JWT_SECRET still has the placeholder value from .env.example');
  }

  if (!(config.platformFeeRate >= 0 && config.platformFeeRate < 1)) {
    problems.push('PLATFORM_FEE_RATE must be between 0 and 1');
  }

  if (problems.length > 0) {
    throw new Error(`Invalid configuration: ${problems.join('; ')}`);
  }
};

module.exports = { config, validateConfig };
