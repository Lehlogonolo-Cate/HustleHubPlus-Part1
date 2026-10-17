const { calculateIncomeTax, estimateFreelancerTax, getTaxYear } = require('../../src/services/taxService');

describe('calculateIncomeTax', () => {
  it('returns zero tax for zero income', () => {
    const result = calculateIncomeTax(0);
    expect(result.tax).toBe(0);
    expect(result.effectiveRate).toBe(0);
  });

  it('returns zero tax below the tax threshold because the primary rebate covers it', () => {
    // 99 000 x 18% = 17 820, exactly the primary rebate
    expect(calculateIncomeTax(99000).tax).toBe(0);
    expect(calculateIncomeTax(90000).tax).toBe(0);
  });

  it('applies the first bracket at 18% less the primary rebate', () => {
    // 200 000 x 18% = 36 000 - 17 820 = 18 180
    const result = calculateIncomeTax(200000);
    expect(result.taxBeforeRebates).toBe(36000);
    expect(result.tax).toBe(18180);
    expect(result.marginalRate).toBe(0.18);
  });

  it('applies the base amount plus the marginal rate in higher brackets', () => {
    // 400 000: 79 998 + (400 000 - 383 100) x 31% = 85 237 - 17 820 = 67 417
    const result = calculateIncomeTax(400000);
    expect(result.taxBeforeRebates).toBe(85237);
    expect(result.tax).toBe(67417);
    expect(result.marginalRate).toBe(0.31);
  });

  it('uses the top bracket for very high incomes', () => {
    // 2 000 000: 666 339 + 121 400 x 45% = 720 969 - 17 820 = 703 149
    expect(calculateIncomeTax(2000000).tax).toBe(703149);
  });

  it('adds the secondary and tertiary rebates for older taxpayers', () => {
    const under65 = calculateIncomeTax(300000).tax;
    const from65 = calculateIncomeTax(300000, { ageGroup: '65to74' }).tax;
    const from75 = calculateIncomeTax(300000, { ageGroup: '75plus' }).tax;
    expect(under65 - from65).toBe(9765);
    expect(from65 - from75).toBe(3249);
  });

  it('never returns negative tax or treats negative income as income', () => {
    expect(calculateIncomeTax(-5000).tax).toBe(0);
    expect(calculateIncomeTax(-5000).taxableIncome).toBe(0);
  });
});

describe('getTaxYear', () => {
  it('starts the tax year on 1 March', () => {
    const year = getTaxYear(new Date(Date.UTC(2026, 2, 1)));
    expect(year.label).toBe('2027');
    expect(year.start.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(year.monthsElapsed).toBe(1);
  });

  it('places January and February in the tax year that started the previous March', () => {
    const year = getTaxYear(new Date(Date.UTC(2027, 1, 15)));
    expect(year.label).toBe('2027');
    expect(year.monthsElapsed).toBe(12);
  });

  it('counts September as month 7', () => {
    expect(getTaxYear(new Date(Date.UTC(2026, 8, 28))).monthsElapsed).toBe(7);
  });
});

describe('estimateFreelancerTax', () => {
  it('projects earnings to a full year based on months elapsed', () => {
    const estimate = estimateFreelancerTax({ earnings: 60000, monthsElapsed: 6 });
    expect(estimate.projected.earnings).toBe(120000);
    // 120 000 x 18% = 21 600 - 17 820 = 3 780
    expect(estimate.projected.tax).toBe(3780);
    expect(estimate.suggestedMonthlySetAside).toBe(315);
  });

  it('subtracts deductions before calculating tax', () => {
    const withoutDeductions = estimateFreelancerTax({ earnings: 300000, monthsElapsed: 12 });
    const withDeductions = estimateFreelancerTax({ earnings: 300000, deductions: 50000, monthsElapsed: 12 });
    expect(withDeductions.yearToDate.taxableIncome).toBe(250000);
    expect(withDeductions.yearToDate.tax).toBeLessThan(withoutDeductions.yearToDate.tax);
  });
});
