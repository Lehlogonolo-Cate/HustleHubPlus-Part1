const express = require('express');

const { ROLES } = require('../constants');
const bookings = require('../controllers/bookingController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { bookingLimiter } = require('../middleware/rateLimiters');
const validate = require('../middleware/validate');
const rules = require('../validators');

const router = express.Router();

router.use(authenticate);

router.get('/', validate(rules.listBookings), bookings.list);
router.post('/', authorize(ROLES.CLIENT), bookingLimiter, validate(rules.createBooking), bookings.create);
router.get('/:id', validate([rules.idParam]), bookings.getOne);
router.patch('/:id/complete', authorize(ROLES.FREELANCER), validate([rules.idParam]), bookings.complete);
router.patch('/:id/cancel', authorize(ROLES.CLIENT), validate([rules.idParam]), bookings.cancel);

module.exports = router;
