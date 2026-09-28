const express = require('express');

const { ROLES } = require('../constants');
const finance = require('../controllers/financeController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const rules = require('../validators');

const transactionRouter = express.Router();
transactionRouter.get('/', authenticate, validate(rules.listTransactions), finance.listTransactions);

const financeRouter = express.Router();
financeRouter.get('/summary', authenticate, authorize(ROLES.FREELANCER), validate(rules.financeSummary), finance.summary);

module.exports = { transactionRouter, financeRouter };
