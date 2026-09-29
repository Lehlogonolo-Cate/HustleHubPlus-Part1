import { describe, expect, it, vi } from 'vitest';

import { apiRequest, ApiError, onUnauthorized, tokenStore } from '../api/client';
import { validateGig, validateRegistration } from '../utils/validation';

describe('validation helpers', () => {
  it('accepts a valid registration', () => {
    expect(
      validateRegistration({
        name: "Thandi O'Neil-Mokoena",
        email: 'thandi@example.com',
        password: 'Str0ng!Passw0rd',
        confirmPassword: 'Str0ng!Passw0rd',
        role: 'client'
      })
    ).toEqual({});
  });

  it('rejects the admin role and script-like names', () => {
    const errors = validateRegistration({
      name: '<script>',
      email: 'a@b.co',
      password: 'Str0ng!Passw0rd',
      confirmPassword: 'Str0ng!Passw0rd',
      role: 'admin'
    });
    expect(errors).toHaveProperty('name');
    expect(errors).toHaveProperty('role');
  });

  it('rejects prices with more than two decimals', () => {
    const errors = validateGig({ title: 'Valid title', description: 'x'.repeat(30), category: 'design', price: '99.999', deliveryDays: '3' });
    expect(errors.price).toBe('Price may have at most two decimal places');
  });
});

describe('api client', () => {
  it('attaches the bearer token and clears the session on 401', async () => {
    tokenStore.set('expired');
    const handler = vi.fn();
    onUnauthorized(handler);
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: 'Invalid or expired authentication token' }) });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer expired');
    expect(handler).toHaveBeenCalled();
  });

  it('maps validation details to field errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Validation failed', details: [{ field: 'price', message: 'Too low' }] })
      })
    );

    const error = await apiRequest('/gigs', { method: 'POST', body: {} }).catch((e) => e);
    expect(error.fieldErrors()).toEqual({ price: 'Too low' });
  });

  it('reports network failures in plain language', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(apiRequest('/gigs')).rejects.toThrow('Cannot reach the server');
  });
});
