const express = require('express');

const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes');
const bookingRoutes = require('./bookingRoutes');
const { financeRouter, transactionRouter } = require('./financeRoutes');
const gigRoutes = require('./gigRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/gigs', gigRoutes);
router.use('/bookings', bookingRoutes);
router.use('/transactions', transactionRouter);
router.use('/finance', financeRouter);
router.use('/admin', adminRoutes);

module.exports = router;
