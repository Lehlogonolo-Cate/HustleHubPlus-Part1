// SARS individual income tax tables for the 2026 year of assessment
// (1 March 2025 - 28 February 2026). Source: sars.gov.za "Rates of Tax for Individuals".
// Update these values each year after the national budget.
// All amounts are in South African rand (ZAR).
module.exports = {
  label: '2026 year of assessment (1 Mar 2025 - 28 Feb 2026)',
  brackets: [
    { min: 0, max: 237100, base: 0, rate: 0.18 },
    { min: 237100, max: 370500, base: 42678, rate: 0.26 },
    { min: 370500, max: 512800, base: 77362, rate: 0.31 },
    { min: 512800, max: 673000, base: 121475, rate: 0.36 },
    { min: 673000, max: 857900, base: 179147, rate: 0.39 },
    { min: 857900, max: 1817000, base: 251258, rate: 0.41 },
    { min: 1817000, max: Infinity, base: 644489, rate: 0.45 }
  ],
  rebates: {
    primary: 17235,
    // Added on top of the primary rebate for taxpayers aged 65 and older
    secondary: 9444,
    // Added on top of the primary and secondary rebates for taxpayers aged 75 and older
    tertiary: 3145
  }
};
