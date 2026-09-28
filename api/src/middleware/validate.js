const { checkExact, matchedData, validationResult } = require('express-validator');

const AppError = require('../utils/AppError');

// Runs a set of express-validator rules, rejects any field that has no rule
// (stops mass assignment such as sending "role": "admin" or "freelancer": "<id>"),
// then exposes only the validated, sanitised values as req.data
const validate = (rules) => [
  ...rules,
  checkExact([], { message: 'Unexpected field in request' }),
  (req, res, next) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      const details = result.array().map((error) => ({
        field: error.type === 'unknown_fields' ? error.fields.map((f) => f.path).join(', ') : error.path,
        message: error.msg
      }));
      throw AppError.badRequest('Validation failed', details);
    }

    req.data = matchedData(req);
    next();
  }
];

module.exports = validate;
