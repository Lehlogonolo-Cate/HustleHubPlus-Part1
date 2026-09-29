const { ROLES, TRANSACTION_STATUS } = require('../constants');
const Booking = require('../models/Booking');
const Gig = require('../models/Gig');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { roundMoney } = require('../utils/money');
const { serializeUser } = require('../utils/serializers');

const listUsers = async ({ role, page = 1, limit = 25 }) => {
  const filter = role ? { role } : {};

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter)
  ]);

  return {
    users: users.map(serializeUser),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
};

const setUserStatus = async (admin, userId, isActive, ctx) => {
  if (admin.id === userId) {
    throw AppError.badRequest('You cannot change the status of your own account');
  }

  const user = await User.findByIdAndUpdate(userId, { isActive }, { returnDocument: 'after' });

  if (!user) {
    throw AppError.notFound('User not found');
  }

  logger.warn(`User ${isActive ? 'reactivated' : 'deactivated'} by admin`, {
    event: isActive ? 'admin.user.reactivated' : 'admin.user.deactivated',
    ...ctx,
    targetUserId: userId
  });

  return serializeUser(user);
};

const getStats = async () => {
  const [users, gigs, bookings, revenue] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Gig.countDocuments({ isActive: true }),
    Booking.countDocuments(),
    Transaction.aggregate([
      { $match: { status: TRANSACTION_STATUS.PAID } },
      { $group: { _id: null, volume: { $sum: '$amount' }, fees: { $sum: '$platformFee' } } }
    ])
  ]);

  const usersByRole = Object.fromEntries(Object.values(ROLES).map((role) => [role, 0]));
  users.forEach((row) => {
    usersByRole[row._id] = row.count;
  });

  return {
    users: usersByRole,
    activeGigs: gigs,
    bookings,
    transactionVolume: roundMoney(revenue[0]?.volume || 0),
    platformFees: roundMoney(revenue[0]?.fees || 0)
  };
};

module.exports = { listUsers, setUserStatus, getStats };
