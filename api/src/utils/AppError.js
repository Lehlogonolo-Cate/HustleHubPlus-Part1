// An error that is safe to show to the client. Anything that is not an AppError
// is treated as unexpected and replaced with a generic 500 message.
class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message, details) {
    return new AppError(400, message, details);
  }

  static unauthorized(message = 'Authentication is required') {
    return new AppError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new AppError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(404, message);
  }

  static conflict(message) {
    return new AppError(409, message);
  }
}

module.exports = AppError;
