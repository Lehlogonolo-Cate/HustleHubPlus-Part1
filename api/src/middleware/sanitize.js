const { filterXSS } = require('xss');

const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Passwords are hashed, never displayed, and must be stored exactly as typed
const SKIP_XSS_FILTER = new Set(['password']);

const xssOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
};

const findOperatorKey = (value) => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findOperatorKey(item);
      if (found) return found;
    }
  } else if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.')) return key;
      const found = findOperatorKey(nested);
      if (found) return found;
    }
  }
  return null;
};

const stripHtml = (value, key) => {
  if (typeof value === 'string') {
    return SKIP_XSS_FILTER.has(key) ? value : filterXSS(value, xssOptions);
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripHtml(item, key));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripHtml(v, k)]));
  }
  return value;
};

// 1. NoSQL injection: reject any request body containing MongoDB
//    operator keys ($ne, $gt, $where...) or dotted paths.
// 2. Stored XSS: remove HTML tags from every string before it reaches validation
//    or the database, so a gig title can never carry a <script>.
// Route IDs are checked with isMongoId(), and query strings are parsed with Express 5's "simple" parser, which never builds
// nested objects, so ?email[$ne]= arrives as a plain string key.
const sanitizeInput = (req, res, next) => {
  const operatorKey = findOperatorKey(req.body);

  if (operatorKey) {
    logger.warn('Blocked request containing a MongoDB operator', {
      event: 'security.injection_blocked',
      key: operatorKey,
      path: req.baseUrl + req.path,
      ...logger.requestContext(req)
    });
    throw AppError.badRequest('Request contains characters that are not allowed');
  }

  if (req.body && typeof req.body === 'object') {
    req.body = stripHtml(req.body);
  }

  next();
};

module.exports = { sanitizeInput, stripHtml };
