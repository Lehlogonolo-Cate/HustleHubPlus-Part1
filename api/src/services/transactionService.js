const Transaction = require('../models/Transaction');
const { serializeTransaction } = require('../utils/serializers');
const { participantFilter } = require('./accessControl');

const listTransactions = async (user, { status } = {}) => {
  const filter = participantFilter(user);
  if (status) filter.status = status;

  const transactions = await Transaction.find(filter)
    .sort({ paidAt: -1 })
    .limit(200)
    .populate('client', 'name')
    .populate('freelancer', 'name');

  return transactions.map(serializeTransaction);
};

module.exports = { listTransactions };
