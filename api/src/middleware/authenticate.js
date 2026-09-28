const User = require('../models/User');
const tokenService = require('../services/tokenService');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const reject = (req, reason, message) => {
  logger.warn('Rejected authentication token', { event: 'auth.token.rejected', reason, ...logger.requestContext(req) });
  throw AppError.unauthorized(message);
};

// Runs on every protected request: the token is verified each time and the user
// is re-checked in the database, so revoked tokens and deactivated accounts are
// refused immediately instead of when the token expires
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    reject(req, 'missing', 'Authentication token is required');
  }

  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    reject(req, 'malformed', 'Authorization header must use the Bearer scheme');
  }

  let payload;
  try {
    payload = tokenService.verifyToken(token);
  } catch {
    reject(req, 'invalid', 'Invalid or expired authentication token');
  }

  if (await tokenService.isTokenRevoked(payload.jti)) {
    reject(req, 'revoked', 'This session has ended. Please log in again.');
  }

  const user = await User.findById(payload.sub).select('name role isActive');

  if (!user || !user.isActive) {
    reject(req, 'inactive_user', 'Account is not available');
  }

  req.user = { id: user.id, name: user.name, role: user.role };
  req.token = { jti: payload.jti, exp: payload.exp };
  next();
};

module.exports = authenticate;
