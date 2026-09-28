const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Role-based access control: only the listed roles may reach the route
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    logger.warn('Access denied by role check', {
      event: 'access.denied',
      requiredRoles: allowedRoles,
      role: req.user?.role,
      path: req.baseUrl + req.path,
      ...logger.requestContext(req)
    });
    const error = AppError.forbidden();
    error.logged = true;
    throw error;
  }
  next();
};

module.exports = authorize;
