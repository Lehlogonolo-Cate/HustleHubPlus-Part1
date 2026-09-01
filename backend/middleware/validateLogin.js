const { body, validationResult } = require('express-validator');

const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isString()
    .withMessage('Password must be a text value')
];

const handleLoginErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((item) => ({
        field: item.path,
        message: item.msg
      }))
    });
  }

  next();
};

module.exports = {
  loginRules,
  handleLoginErrors
};