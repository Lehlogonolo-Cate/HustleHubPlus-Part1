const express = require('express');

const authenticateToken = require('../middleware/authenticateToken');
const authorizeRoles = require('../middleware/authorizeRoles');
const { listUsers } = require('../controllers/adminController');

const router = express.Router();

// Every route in this file requires a valid token AND the admin role
router.use(authenticateToken, authorizeRoles('admin'));

router.get('/users', listUsers);

module.exports = router;