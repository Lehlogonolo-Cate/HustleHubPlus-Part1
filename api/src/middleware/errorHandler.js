const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const notFound = (req, res) => {
  res.status(404).json({ error: 'Route not found', requestId: req.id });
};

// Converts known error types into safe messages. Anything unexpected is logged in
// full on the server, but the client only ever receives a generic message and the
// request ID - never a stack trace, file path, query or configuration value.
const errorHandler = (error, req, res, next) => {
  let status = 500;
  let body = { error: 'An unexpected error occurred' };

  if (error instanceof AppError) {
    status = error.statusCode;
    body = { error: error.message, ...(error.details && { details: error.details }) };
  } else if (error.type === 'entity.parse.failed') {
    status = 400;
    body = { error: 'Request body must be valid JSON' };
  } else if (error.type === 'entity.too.large') {
    status = 413;
    body = { error: 'Request body is too large' };
  } else if (error.name === 'CastError') {
    status = 400;
    body = { error: 'Invalid identifier' };
  } else if (error.name === 'ValidationError') {
    status = 400;
    body = { error: 'Validation failed' };
  }

  // Ownership checks throw from the service layer; record them as access-control events
  if (status === 403 && !error.logged) {
    logger.warn('Access denied by ownership check', {
      event: 'access.denied',
      reason: error.message,
      method: req.method,
      path: req.baseUrl + req.path,
      ...logger.requestContext(req)
    });
  }

  if (status >= 500) {
    logger.error('Unhandled error', {
      event: 'error.unhandled',
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      path: req.baseUrl + req.path,
      ...logger.requestContext(req)
    });
  }

  res.status(status).json({ ...body, requestId: req.id });
};

module.exports = { notFound, errorHandler };
