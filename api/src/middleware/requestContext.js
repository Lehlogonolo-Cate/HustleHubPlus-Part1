const crypto = require('crypto');

const logger = require('../utils/logger');

// Gives every request an ID that appears in logs and in error responses, so a
// user-reported error can be traced to the exact log entries without exposing details
const requestId = (req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};

// One access-log line per request. Only the path is logged (never the body or
// headers) so credentials and tokens cannot end up in the logs.
const requestLogger = (req, res, next) => {
  const started = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger.log(level, `${req.method} ${req.path} ${res.statusCode}`, {
      event: 'http.request',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
      ...logger.requestContext(req)
    });
  });

  next();
};

module.exports = { requestId, requestLogger };
