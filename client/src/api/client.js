// Thin wrapper around fetch. Every call goes to the same origin (/api), which the
// Vite dev server or nginx forwards to the backend over HTTPS.
const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'hustlehub.token';

export class ApiError extends Error {
  constructor(status, message, details = [], requestId) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }

  // Maps server validation details to { field: message } for form display
  fieldErrors() {
    return Object.fromEntries((this.details || []).map((d) => [d.field, d.message]));
  }
}

// sessionStorage (not localStorage) so the token is cleared when the tab closes.
// The strict Content Security Policy is the main defence against script injection
// that could read it.
export const tokenStore = {
  get: () => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable: the session lasts until reload */
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }
};

let unauthorizedHandler = () => {};
export const onUnauthorized = (handler) => {
  unauthorizedHandler = handler;
};

const GENERIC_ERROR = 'Something went wrong. Please try again.';

export async function apiRequest(path, { method = 'GET', body, query } = {}) {
  const headers = { Accept: 'application/json' };
  const token = tokenStore.get();

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const search = query
    ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== '')).toString()}`
    : '';

  let response;
  try {
    response = await fetch(`${API_BASE}${path}${search}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    /* non-JSON response */
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      unauthorizedHandler();
    }
    // The API only sends safe, user-facing messages; anything else gets a generic one
    const message = response.status >= 500 || !data?.error ? GENERIC_ERROR : data.error;
    throw new ApiError(response.status, message, data?.details, data?.requestId);
  }

  return data;
}

export const api = {
  register: (details) => apiRequest('/auth/register', { method: 'POST', body: details }),
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/auth/me'),

  listGigs: (query) => apiRequest('/gigs', { query }),
  myGigs: () => apiRequest('/gigs/mine'),
  getGig: (id) => apiRequest(`/gigs/${encodeURIComponent(id)}`),
  createGig: (gig) => apiRequest('/gigs', { method: 'POST', body: gig }),
  updateGig: (id, changes) => apiRequest(`/gigs/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes }),
  deleteGig: (id) => apiRequest(`/gigs/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  createBooking: (booking) => apiRequest('/bookings', { method: 'POST', body: booking }),
  listBookings: (query) => apiRequest('/bookings', { query }),
  completeBooking: (id) => apiRequest(`/bookings/${encodeURIComponent(id)}/complete`, { method: 'PATCH' }),
  cancelBooking: (id) => apiRequest(`/bookings/${encodeURIComponent(id)}/cancel`, { method: 'PATCH' }),

  listTransactions: (query) => apiRequest('/transactions', { query }),
  financeSummary: (query) => apiRequest('/finance/summary', { query }),

  adminUsers: (query) => apiRequest('/admin/users', { query }),
  adminStats: () => apiRequest('/admin/stats'),
  setUserStatus: (id, isActive) =>
    apiRequest(`/admin/users/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { isActive } })
};
