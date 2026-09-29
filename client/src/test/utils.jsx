import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi } from 'vitest';

import { AuthProvider } from '../context/AuthContext';

// Replaces fetch with a router of canned API responses: { 'POST /auth/login': { status, body } }
export function mockApi(routes) {
  const calls = [];
  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET';
    const path = url.replace(/^\/api/, '').split('?')[0];
    calls.push({ method, path, url, body: options.body ? JSON.parse(options.body) : undefined, headers: options.headers });

    const handler = routes[`${method} ${path}`];
    const response = typeof handler === 'function' ? handler(calls.at(-1)) : handler;
    const { status = 200, body = {} } = response || { status: 404, body: { error: 'Route not found' } };

    return { ok: status >= 200 && status < 300, status, json: async () => body };
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, calls };
}

export function renderWithProviders(ui, { route = '/', path = '*', extraRoutes = [] } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path={path} element={ui} />
          {extraRoutes.map(({ path: p, element }) => (
            <Route key={p} path={p} element={element} />
          ))}
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

export const freelancer = { id: 'f1', name: 'Thandi Mokoena', email: 'thandi@example.com', role: 'freelancer', isActive: true };
export const client = { id: 'c1', name: 'Sipho Dlamini', email: 'sipho@example.com', role: 'client', isActive: true };

export const signInAs = (user) => {
  sessionStorage.setItem('hustlehub.token', 'test-token');
  return { 'GET /auth/me': { body: { user } } };
};
