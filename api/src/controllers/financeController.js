const financeService = require('../services/financeService');
const transactionService = require('../services/transactionService');

const listTransactions = async (req, res) => {
  const transactions = await transactionService.listTransactions(req.user, req.data);
  res.status(200).json({ transactions });
};

const summary = async (req, res) => {
  const result = await financeService.getFreelancerSummary(req.user.id, req.data);
  res.status(200).json(result);
};

module.exports = { listTransactions, summary };
