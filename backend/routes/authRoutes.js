const express = require('express');

const {
  register,
  login,
  getProfile
} = require('../controllers/authController');

const {
  registrationRules,
  handleRegistrationErrors
} = require('../middleware/validateRegistration');

const {
  loginRules,
  handleLoginErrors
} = require('../middleware/validateLogin');

const authenticateToken =
  require('../middleware/authenticateToken');

const router = express.Router();

router.post(
  '/register',
  registrationRules,
  handleRegistrationErrors,
  register
);

router.post(
  '/login',
  loginRules,
  handleLoginErrors,
  login
);

router.get(
  '/profile',
  authenticateToken,
  getProfile
);

module.exports = router;