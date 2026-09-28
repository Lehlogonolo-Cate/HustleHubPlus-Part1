const fs = require('fs');
const winston = require('winston');

const { config } = require('../config/env');

// Keys that must never reach a log file, even by accident
const SENSITIVE_KEYS = ['password', 'passwordhash', 'token', 'authorization', 'jwt', 'secret'];

const redact = winston.format((info) => {
  for (const key of Object.keys(info)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      // key comes from Object.keys() of the log entry itself, not from user input
      // eslint-disable-next-line security/detect-object-injection
      info[key] = '[REDACTED]';
    }
  }
  return info;
});

const transports = [
  new winston.transports.Console({
    format: config.isProduction
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, event, requestId }) =>
            `${timestamp} ${level} ${event ? `[${event}] ` : ''}${message}${requestId ? ` (req ${requestId})` : ''}`
          )
        )
  })
];

if (!config.isTest) {
  // logDir comes from server configuration, never from a request
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.mkdirSync(config.logDir, { recursive: true });

  transports.push(
    new winston.transports.File({
      filename: `${config.logDir}/app.log`,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: `${config.logDir}/error.log`,
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5
    })
  );
}

const logger = winston.createLogger({
  level: config.logLevel,
  silent: config.isTest && process.env.LOG_IN_TESTS !== 'true',
  defaultMeta: { service: 'hustlehub-api' },
  format: winston.format.combine(redact(), winston.format.timestamp(), winston.format.json()),
  transports
});

// Builds the standard context attached to security-relevant log entries
logger.requestContext = (req) => ({
  requestId: req.id,
  userId: req.user?.id,
  ip: req.ip
});

module.exports = logger;
