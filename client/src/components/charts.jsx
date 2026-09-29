import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatCompactCurrency, formatCurrency } from '../utils/format';

function MonthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const month = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">{label}</p>
      <p>
        Earnings <strong>{formatCurrency(month.earnings)}</strong>
      </p>
      <p className="muted">
        {month.transactions} {month.transactions === 1 ? 'booking' : 'bookings'} · fees {formatCurrency(month.fees)}
      </p>
    </div>
  );
}

// Single series, so no legend: the card title names it. A table view is always available.
export function MonthlyEarningsChart({ months }) {
  const data = months.map((m) => ({ ...m, label: m.month.split(' ')[0] }));

  return (
    <figure className="chart">
      <div className="chart__plot" aria-hidden="true">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} className="chart__grid" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} className="chart__axis" interval="preserveStartEnd" minTickGap={6} />
            <YAxis
              tickFormatter={formatCompactCurrency}
              tickLine={false}
              axisLine={false}
              width={64}
              className="chart__axis"
            />
            <Tooltip content={<MonthTooltip />} cursor={{ className: 'chart__cursor' }} />
            <Bar dataKey="earnings" className="chart__bar" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="chart__table">
        <summary>View as table</summary>
        <table className="table table--compact">
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col" className="num">Bookings</th>
              <th scope="col" className="num">Gross</th>
              <th scope="col" className="num">Fees</th>
              <th scope="col" className="num">Earnings</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month}>
                <td>{m.month}</td>
                <td className="num">{m.transactions}</td>
                <td className="num">{formatCurrency(m.gross)}</td>
                <td className="num">{formatCurrency(m.fees)}</td>
                <td className="num">{formatCurrency(m.earnings)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

// Part-to-whole of gross income: what the freelancer keeps, the estimated tax and
// the platform fee. Every segment is labelled with its value, so colour is never
// the only way to tell them apart.
export function IncomeBreakdown({ gross, fees, tax }) {
  const takeHome = Math.max(0, gross - fees - tax);
  const parts = [
    { key: 'take-home', label: 'Take-home (after tax)', value: takeHome },
    { key: 'tax', label: 'Estimated tax', value: Math.min(tax, gross - fees) },
    { key: 'fees', label: 'Platform fees', value: fees }
  ];

  if (gross <= 0) {
    return <p className="muted">No income this tax year yet. Completed bookings will appear here.</p>;
  }

  return (
    <div className="breakdown">
      <div className="breakdown__bar" role="img" aria-label="Breakdown of gross income into take-home, tax and fees">
        {parts
          .filter((part) => part.value > 0)
          .map((part) => (
            <span
              key={part.key}
              className={`breakdown__segment breakdown__segment--${part.key}`}
              style={{ flexGrow: part.value }}
              title={`${part.label}: ${formatCurrency(part.value)}`}
            />
          ))}
      </div>
      <ul className="breakdown__legend">
        {parts.map((part) => (
          <li key={part.key}>
            <span className={`swatch swatch--${part.key}`} aria-hidden="true" />
            <span className="breakdown__label">{part.label}</span>
            <span className="breakdown__value">{formatCurrency(part.value)}</span>
            <span className="breakdown__share">{Math.round((part.value / gross) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
