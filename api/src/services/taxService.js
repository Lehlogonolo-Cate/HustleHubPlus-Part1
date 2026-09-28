// Pure functions only (no database access), so the tax logic is easy to unit test.
const defaultTables = require('../config/taxTables');
const { roundMoney } = require('../utils/money');

// The South African tax year runs from 1 March to the end of February. It is
// named after the year it ends in: 1 Mar 2026 - 28 Feb 2027 is the "2027" tax year.
const getTaxYear = (date = new Date()) => {
  const year = date.getUTCFullYear();
  const startYear = date.getUTCMonth() >= 2 ? year : year - 1;

  const start = new Date(Date.UTC(startYear, 2, 1));
  const end = new Date(Date.UTC(startYear + 1, 2, 1)); // exclusive

  // Months into the tax year, counting the current month (1 = March, 12 = February)
  const monthsElapsed = (date.getUTCMonth() - 2 + 12) % 12 + 1;

  return { label: `${startYear + 1}`, start, end, monthsElapsed };
};

const findBracket = (income, brackets) =>
  brackets.find((bracket) => income > bracket.min && income <= bracket.max) || brackets[0];

const totalRebate = (ageGroup, rebates) => {
  let rebate = rebates.primary;
  if (ageGroup === '65to74' || ageGroup === '75plus') rebate += rebates.secondary;
  if (ageGroup === '75plus') rebate += rebates.tertiary;
  return rebate;
};

// Annual income tax on a taxable amount:
// tax = bracket base + (income - bracket threshold) x marginal rate - rebates, never below zero
const calculateIncomeTax = (taxableIncome, { ageGroup = 'under65', tables = defaultTables } = {}) => {
  const income = Math.max(0, roundMoney(taxableIncome));
  const bracket = findBracket(income, tables.brackets);

  const taxBeforeRebates = income > 0 ? bracket.base + (income - bracket.min) * bracket.rate : 0;
  const rebate = totalRebate(ageGroup, tables.rebates);
  const tax = Math.max(0, taxBeforeRebates - rebate);

  return {
    taxableIncome: income,
    marginalRate: bracket.rate,
    taxBeforeRebates: roundMoney(taxBeforeRebates),
    rebate: roundMoney(Math.min(rebate, taxBeforeRebates)),
    tax: roundMoney(tax),
    effectiveRate: income > 0 ? Math.round((tax / income) * 10000) / 10000 : 0
  };
};

// Builds the estimate shown on the freelancer dashboard:
// - yearToDate: tax on what has been earned so far this tax year
// - projected: tax if earnings continue at the same monthly pace for the full year
const estimateFreelancerTax = ({ earnings, deductions = 0, ageGroup = 'under65', monthsElapsed, tables = defaultTables }) => {
  const yearToDate = calculateIncomeTax(Math.max(0, earnings - deductions), { ageGroup, tables });

  const projectedEarnings = roundMoney((earnings / monthsElapsed) * 12);
  const projected = calculateIncomeTax(Math.max(0, projectedEarnings - deductions), { ageGroup, tables });

  return {
    tablesUsed: tables.label,
    ageGroup,
    deductions: roundMoney(deductions),
    yearToDate,
    projected: { earnings: projectedEarnings, ...projected },
    // Provisional taxpayers settle in two instalments during the year (August and February)
    suggestedMonthlySetAside: roundMoney(projected.tax / 12)
  };
};

module.exports = { getTaxYear, calculateIncomeTax, estimateFreelancerTax };
