import { useEffect, useState } from 'react';

import { api } from '../api/client';
import { IncomeBreakdown, MonthlyEarningsChart } from '../components/charts';
import { Alert, Loading, PageHeader, StatCard } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, formatPercent } from '../utils/format';

const AGE_GROUPS = [
  { value: 'under65', label: 'Under 65' },
  { value: '65to74', label: '65 to 74' },
  { value: '75plus', label: '75 and older' }
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [ageGroup, setAgeGroup] = useState('under65');
  const [deductionsInput, setDeductionsInput] = useState('');
  const [deductions, setDeductions] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .financeSummary({ ageGroup, deductions: deductions || undefined })
      .then((data) => active && (setSummary(data), setError(null)))
      .catch((err) => active && setError(err));
    return () => {
      active = false;
    };
  }, [ageGroup, deductions]);

  const applyDeductions = (event) => {
    event.preventDefault();
    const value = Number(deductionsInput);
    setDeductions(Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : 0);
  };

  if (error && !summary) return <Alert requestId={error.requestId}>{error.message}</Alert>;
  if (!summary) return <Loading label="Loading your earnings…" />;

  const { totals, tax, taxYear, bookings } = summary;

  return (
    <>
      <PageHeader
        title={`Hi ${user.name.split(' ')[0]}, here are your earnings`}
        subtitle={`Tax year ${taxYear.label}: ${formatDate(taxYear.start, { utc: true })} to ${formatDate(taxYear.end, { utc: true })} · month ${taxYear.monthsElapsed} of 12`}
      />

      <Alert requestId={error?.requestId}>{error?.message}</Alert>

      <section className="stat-grid" aria-label="Income summary">
        <StatCard label="Earnings this tax year" value={formatCurrency(totals.earnings)} note={`${totals.transactions} paid bookings`} tone="accent" />
        <StatCard label="Estimated tax so far" value={formatCurrency(tax.yearToDate.tax)} note={`Effective rate ${formatPercent(tax.yearToDate.effectiveRate)}`} />
        <StatCard
          label="Projected tax for the year"
          value={formatCurrency(tax.projected.tax)}
          note={`On projected earnings of ${formatCurrency(tax.projected.earnings)}`}
        />
        <StatCard label="Suggested monthly set-aside" value={formatCurrency(tax.suggestedMonthlySetAside)} note="Projected tax ÷ 12" />
      </section>

      <div className="dashboard-grid">
        <section className="card">
          <h2>Monthly earnings</h2>
          <p className="muted">Your earnings after platform fees, per month of the tax year.</p>
          <MonthlyEarningsChart months={summary.monthly} />
        </section>

        <section className="card">
          <h2>Where your income goes</h2>
          <p className="muted">Gross bookings of {formatCurrency(totals.gross)} this tax year.</p>
          <IncomeBreakdown gross={totals.gross} fees={totals.fees} tax={tax.yearToDate.tax} />

          <dl className="facts">
            <div>
              <dt>Marginal rate</dt>
              <dd>{formatPercent(tax.projected.marginalRate)}</dd>
            </div>
            <div>
              <dt>Bookings</dt>
              <dd>
                {bookings.confirmed} active · {bookings.completed} completed · {bookings.cancelled} cancelled
              </dd>
            </div>
            <div>
              <dt>Lifetime earnings</dt>
              <dd>{formatCurrency(summary.lifetimeEarnings)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="card">
        <h2>Adjust your tax estimate</h2>
        <form className="toolbar toolbar--left" onSubmit={applyDeductions}>
          <label>
            Age group
            <select value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)}>
              {AGE_GROUPS.map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Deductible expenses (ZAR)
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={deductionsInput}
              onChange={(event) => setDeductionsInput(event.target.value)}
              placeholder="0.00"
            />
          </label>
          <button type="submit" className="btn btn--primary">
            Recalculate
          </button>
        </form>
        <p className="muted small">
          This is an estimate using SARS {tax.tablesUsed} tables and your HustleHub+ earnings only. It does not include
          other income, medical credits or provisional tax already paid. Freelancers usually register as provisional
          taxpayers and pay in two instalments (August and February). Confirm your figures with SARS or a tax practitioner.
        </p>
      </section>
    </>
  );
}
