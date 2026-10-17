// SARS individual income tax tables for the 2027 year of assessment
// (1 March 2026 - 28 February 2027). Source: sars.gov.za "Rates of Tax for Individuals".
// Update these values each year after the national budget.
// All amounts are in South African rand (ZAR).
module.exports = {
  label: '2027 year of assessment (1 Mar 2026 - 28 Feb 2027)',
  brackets: [
    { min: 0, max: 245100, base: 0, rate: 0.18 },
    { min: 245100, max: 383100, base: 44118, rate: 0.26 },
    { min: 383100, max: 530200, base: 79998, rate: 0.31 },
    { min: 530200, max: 695800, base: 125599, rate: 0.36 },
    { min: 695800, max: 887000, base: 185215, rate: 0.39 },
    { min: 887000, max: 1878600, base: 259783, rate: 0.41 },
    { min: 1878600, max: Infinity, base: 666339, rate: 0.45 }
  ],
  rebates: {
    primary: 17820,
    // Added on top of the primary rebate for taxpayers aged 65 and older
    secondary: 9765,
    // Added on top of the primary and secondary rebates for taxpayers aged 75 and older
    tertiary: 3249
  }
};
