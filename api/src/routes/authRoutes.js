const express = require('express');

const auth = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rateLimiters');
const validate = require('../middleware/validate');
const rules = require('../validators');

const router = express.Router();

router.post('/register', authLimiter, validate(rules.register), auth.register);
router.post('/login', authLimiter, validate(rules.login), auth.login);
router.post('/logout', authenticate, auth.logout);
router.get('/me', authenticate, auth.me);

module.exports = router;
