import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import DashboardPage from '../pages/DashboardPage';
import { formatCurrency, formatPercent } from '../utils/format';
import { freelancer, mockApi, renderWithProviders, signInAs } from './utils';

// Intl uses non-breaking spaces; Testing Library normalises rendered text to plain spaces
const money = (value) => formatCurrency(value).replace(/\s/g, ' ');

const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'].map((name, i) => ({
  month: `${name} 2026`,
  gross: i === 6 ? 20000 : 0,
  fees: i === 6 ? 2000 : 0,
  earnings: i === 6 ? 18000 : 0,
  transactions: i === 6 ? 4 : 0
}));

const summary = (overrides = {}) => ({
  taxYear: { label: '2027', start: '2026-03-01T00:00:00.000Z', end: '2027-02-28T23:59:59.999Z', monthsElapsed: 7 },
  totals: { gross: 20000, fees: 2000, earnings: 18000, transactions: 4 },
  lifetimeEarnings: 18000,
  bookings: { confirmed: 2, completed: 2, cancelled: 1 },
  monthly: months,
  tax: {
    tablesUsed: '2026 year of assessment',
    ageGroup: 'under65',
    deductions: 0,
    yearToDate: { taxableIncome: 18000, tax: 0, effectiveRate: 0, marginalRate: 0.18 },
    projected: { earnings: 30857.14, tax: 0, effectiveRate: 0, marginalRate: 0.18 },
    suggestedMonthlySetAside: 0,
    ...overrides
  }
});

describe('DashboardPage', () => {
  it('shows income and tax summary cards', async () => {
    mockApi({ ...signInAs(freelancer), 'GET /finance/summary': { body: summary() } });
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('Earnings this tax year')).toBeInTheDocument();
    expect(screen.getAllByText(money(18000)).length).toBeGreaterThan(0);
    expect(screen.getByText('4 paid bookings')).toBeInTheDocument();
    expect(screen.getByText('Projected tax for the year')).toBeInTheDocument();
    expect(screen.getByText(/Tax year 2027/)).toBeInTheDocument();
  });

  it('labels every part of the income breakdown with its value', async () => {
    mockApi({
      ...signInAs(freelancer),
      'GET /finance/summary': { body: summary({ yearToDate: { taxableIncome: 18000, tax: 3000, effectiveRate: 0.1667, marginalRate: 0.18 } }) }
    });
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('Take-home (after tax)')).toBeInTheDocument();
    expect(screen.getByText(money(15000))).toBeInTheDocument();
    expect(screen.getByText('Platform fees')).toBeInTheDocument();
    expect(screen.getByText(`Effective rate ${formatPercent(0.1667)}`)).toBeInTheDocument();
  });

  it('offers the monthly chart as a table', async () => {
    mockApi({ ...signInAs(freelancer), 'GET /finance/summary': { body: summary() } });
    renderWithProviders(<DashboardPage />);

    await userEvent.click(await screen.findByText('View as table'));
    expect(screen.getByRole('cell', { name: 'Sep 2026' })).toBeInTheDocument();
  });

  it('recalculates with deductions and age group', async () => {
    const { calls } = mockApi({ ...signInAs(freelancer), 'GET /finance/summary': { body: summary() } });
    renderWithProviders(<DashboardPage />);

    await userEvent.selectOptions(await screen.findByLabelText('Age group'), '65to74');
    await userEvent.type(screen.getByLabelText('Deductible expenses (ZAR)'), '1500');
    await userEvent.click(screen.getByRole('button', { name: 'Recalculate' }));

    const last = calls.filter((c) => c.path === '/finance/summary').at(-1);
    expect(last.url).toContain('ageGroup=65to74');
    expect(last.url).toContain('deductions=1500');
  });
});
