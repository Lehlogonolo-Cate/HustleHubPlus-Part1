const express = require('express');

const { ROLES } = require('../constants');
const admin = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const rules = require('../validators');

const router = express.Router();

// Every route in this file requires a valid token AND the admin role
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/users', validate(rules.listUsers), admin.listUsers);
router.patch('/users/:id/status', validate(rules.setUserStatus), admin.setUserStatus);
router.get('/stats', admin.stats);

module.exports = router;
