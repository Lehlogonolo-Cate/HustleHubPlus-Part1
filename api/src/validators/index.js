const { body, param, query } = require('express-validator');

const {
  AGE_GROUPS,
  BOOKING_STATUS,
  GIG_CATEGORIES,
  ROLES,
  SELF_REGISTER_ROLES,
  TRANSACTION_STATUS
} = require('../constants');

const hasAtMostTwoDecimals = (value) => {
  const cents = Number(value) * 100;
  return Math.abs(cents - Math.round(cents)) < 1e-6;
};

// ---------- shared ----------

const idParam = param('id').isMongoId().withMessage('Invalid identifier');

const pagination = [
  query('page').optional().isInt({ min: 1, max: 1000 }).withMessage('page must be between 1 and 1000').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50').toInt()
];

const emailField = () =>
  body('email')
    .isString().withMessage('Email is required')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isLength({ max: 254 }).withMessage('Email is too long')
    .isEmail().withMessage('A valid email address is required')
    .toLowerCase();

// ---------- auth ----------

const register = [
  body('name')
    .isString().withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters')
    .matches(/^[\p{L}\s'-]+$/u).withMessage('Name may only contain letters, spaces, apostrophes and hyphens'),
  emailField(),
  body('password')
    .isString().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    // bcrypt only uses the first 72 bytes, so longer passwords are refused rather than silently truncated
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Password must be at most 72 bytes')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain a special character'),
  body('role')
    .isString().withMessage('Role is required')
    .isIn(SELF_REGISTER_ROLES).withMessage('Role must be either client or freelancer')
];

const login = [
  emailField(),
  body('password')
    .isString().withMessage('Password is required')
    .notEmpty().withMessage('Password is required')
    .isLength({ max: 128 }).withMessage('Password is too long')
];

// ---------- gigs ----------

const gigFields = (optional) => {
  const field = (chain) => (optional ? chain.optional() : chain);
  return [
    field(body('title'))
      .isString().withMessage('Title is required')
      .trim()
      .isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
    field(body('description'))
      .isString().withMessage('Description is required')
      .trim()
      .isLength({ min: 20, max: 2000 }).withMessage('Description must be between 20 and 2000 characters'),
    field(body('category'))
      .isIn(GIG_CATEGORIES).withMessage(`Category must be one of: ${GIG_CATEGORIES.join(', ')}`),
    field(body('price'))
      .isFloat({ min: 50, max: 1000000 }).withMessage('Price must be between R50 and R1,000,000')
      .custom(hasAtMostTwoDecimals).withMessage('Price may have at most two decimal places')
      .toFloat(),
    field(body('deliveryDays'))
      .isInt({ min: 1, max: 90 }).withMessage('Delivery time must be between 1 and 90 days')
      .toInt(),
    body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be true or false')
  ];
};

const createGig = gigFields(false);

const updateGig = [idParam, ...gigFields(true)];

const listGigs = [
  query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('Search text is too long'),
  query('category').optional().isIn(GIG_CATEGORIES).withMessage('Unknown category'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be a positive number').toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be a positive number').toFloat(),
  ...pagination
];

// ---------- bookings & transactions ----------

const createBooking = [
  body('gigId').isMongoId().withMessage('A valid gigId is required'),
  body('requirements')
    .optional()
    .isString().withMessage('Requirements must be text')
    .trim()
    .isLength({ max: 1000 }).withMessage('Requirements must be at most 1000 characters')
];

const listBookings = [
  query('status').optional().isIn(Object.values(BOOKING_STATUS)).withMessage('Unknown booking status')
];

const listTransactions = [
  query('status').optional().isIn(Object.values(TRANSACTION_STATUS)).withMessage('Unknown transaction status')
];

// ---------- finance ----------

const financeSummary = [
  query('ageGroup').optional().isIn(AGE_GROUPS).withMessage(`ageGroup must be one of: ${AGE_GROUPS.join(', ')}`),
  query('deductions')
    .optional()
    .isFloat({ min: 0, max: 100000000 }).withMessage('Deductions must be a positive amount')
    .toFloat()
];

// ---------- admin ----------

const listUsers = [
  query('role').optional().isIn(Object.values(ROLES)).withMessage('Unknown role'),
  ...pagination
];

const setUserStatus = [
  idParam,
  body('isActive').isBoolean({ strict: true }).withMessage('isActive must be true or false')
];

module.exports = {
  idParam,
  register,
  login,
  createGig,
  updateGig,
  listGigs,
  createBooking,
  listBookings,
  listTransactions,
  financeSummary,
  listUsers,
  setUserStatus
};
