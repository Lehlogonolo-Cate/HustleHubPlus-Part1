const mongoose = require('mongoose');

const { BOOKING_STATUS, TRANSACTION_STATUS } = require('../constants');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const { roundMoney } = require('../utils/money');
const taxService = require('./taxService');

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Income summary and tax estimate for one freelancer, for the current tax year
const getFreelancerSummary = async (freelancerId, { ageGroup, deductions = 0, now = new Date() } = {}) => {
  const taxYear = taxService.getTaxYear(now);
  const freelancer = new mongoose.Types.ObjectId(freelancerId);

  const [monthly, bookingCounts, lifetime] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          freelancer,
          status: TRANSACTION_STATUS.PAID,
          paidAt: { $gte: taxYear.start, $lt: taxYear.end }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
          gross: { $sum: '$amount' },
          fees: { $sum: '$platformFee' },
          earnings: { $sum: '$freelancerEarnings' },
          count: { $sum: 1 }
        }
      }
    ]),
    Booking.aggregate([
      { $match: { freelancer } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Transaction.aggregate([
      { $match: { freelancer, status: TRANSACTION_STATUS.PAID } },
      { $group: { _id: null, earnings: { $sum: '$freelancerEarnings' } } }
    ])
  ]);

  // One entry per month of the tax year (March to February), including empty months
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(taxYear.start.getUTCFullYear(), 2 + index, 1));
    const match = monthly.find(
      (row) => row._id.year === date.getUTCFullYear() && row._id.month === date.getUTCMonth() + 1
    );
    return {
      month: `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`,
      gross: roundMoney(match?.gross || 0),
      fees: roundMoney(match?.fees || 0),
      earnings: roundMoney(match?.earnings || 0),
      transactions: match?.count || 0
    };
  });

  const totals = months.reduce(
    (sum, month) => ({
      gross: roundMoney(sum.gross + month.gross),
      fees: roundMoney(sum.fees + month.fees),
      earnings: roundMoney(sum.earnings + month.earnings),
      transactions: sum.transactions + month.transactions
    }),
    { gross: 0, fees: 0, earnings: 0, transactions: 0 }
  );

  const countFor = (status) => bookingCounts.find((row) => row._id === status)?.count || 0;

  return {
    taxYear: {
      label: taxYear.label,
      start: taxYear.start,
      end: new Date(taxYear.end.getTime() - 1),
      monthsElapsed: taxYear.monthsElapsed
    },
    totals,
    lifetimeEarnings: roundMoney(lifetime[0]?.earnings || 0),
    bookings: {
      confirmed: countFor(BOOKING_STATUS.CONFIRMED),
      completed: countFor(BOOKING_STATUS.COMPLETED),
      cancelled: countFor(BOOKING_STATUS.CANCELLED)
    },
    monthly: months,
    tax: taxService.estimateFreelancerTax({
      earnings: totals.earnings,
      deductions,
      ageGroup,
      monthsElapsed: taxYear.monthsElapsed
    })
  };
};

module.exports = { getFreelancerSummary };
