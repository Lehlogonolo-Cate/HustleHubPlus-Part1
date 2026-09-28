const { rateLimit } = require('express-rate-limit');

const { config } = require('../config/env');
const logger = require('../utils/logger');

const windowMs = config.rateLimits.windowMinutes * 60 * 1000;

const buildLimiter = (name, limit, options = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        event: 'security.rate_limited',
        limiter: name,
        path: req.baseUrl + req.path,
        ...logger.requestContext(req)
      });
      res.status(429).json({
        error: 'Too many requests. Please wait and try again later.',
        requestId: req.id
      });
    },
    ...options
  });

// Applies to every request as a general safety net
const generalLimiter = buildLimiter('general', config.rateLimits.general);

// Login and registration: slows down password guessing and account spam
const authLimiter = buildLimiter('auth', config.rateLimits.auth);

// Booking creation, counted per signed-in user rather than per IP address
const bookingLimiter = buildLimiter('booking', config.rateLimits.booking, {
  keyGenerator: (req) => `user:${req.user.id}`
});

module.exports = { generalLimiter, authLimiter, bookingLimiter };
