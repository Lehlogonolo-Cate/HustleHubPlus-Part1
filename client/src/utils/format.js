const currencyFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2
});

export const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);

export const formatCompactCurrency = (value) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', notation: 'compact', maximumFractionDigits: 1 }).format(
    Number(value) || 0
  );

export const formatPercent = (value) => `${((Number(value) || 0) * 100).toFixed(1)}%`;

// utc: true for calendar boundaries such as the tax year, which the API sends as UTC dates
export const formatDate = (value, { utc = false } = {}) =>
  value
    ? new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', ...(utc && { timeZone: 'UTC' }) }).format(new Date(value))
    : '-';

export const capitalise = (text = '') => text.charAt(0).toUpperCase() + text.slice(1);

export const GIG_CATEGORIES = ['design', 'development', 'writing', 'marketing', 'video', 'music', 'business', 'other'];
