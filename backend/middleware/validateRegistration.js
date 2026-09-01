const { body, validationResult } = require('express-validator');

const registrationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Name contains invalid characters'),

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
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number')
    .matches(/[^a-zA-Z0-9]/)
    .withMessage('Password must contain a special character'),

  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['client', 'freelancer'])
    .withMessage('Role must be either client or freelancer')
];

const handleRegistrationErrors = (req, res, next) => {
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
  registrationRules,
  handleRegistrationErrors
};