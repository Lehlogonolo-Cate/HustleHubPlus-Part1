const { startDatabase, clearDatabase, stopDatabase } = require('../helpers/db');
const { api, newUser, createUser, bearer, PASSWORD } = require('../helpers/factory');
const User = require('../../src/models/User');

beforeAll(startDatabase);
afterEach(clearDatabase);
afterAll(stopDatabase);

describe('POST /api/auth/register', () => {
  it('registers a user and never returns the password or its hash', async () => {
    const details = newUser('client');
    const res = await api().post('/api/auth/register').send(details);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: details.email, role: 'client' });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('stores a bcrypt hash, not the plain-text password', async () => {
    const details = newUser('freelancer');
    await api().post('/api/auth/register').send(details);

    const stored = await User.findOne({ email: details.email }).select('+passwordHash');
    expect(stored.passwordHash).not.toBe(PASSWORD);
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email with 409', async () => {
    const details = newUser('client');
    await api().post('/api/auth/register').send(details);
    const res = await api().post('/api/auth/register').send({ ...details, email: details.email.toUpperCase() });

    expect(res.status).toBe(409);
  });

  it.each([
    ['weak password', { password: 'password' }],
    ['invalid email', { email: 'not-an-email' }],
    ['self-assigned admin role', { role: 'admin' }],
    ['script in name', { name: '<script>alert(1)</script>' }],
    ['non-string password', { password: 12345678 }]
  ])('rejects %s with 400', async (_label, override) => {
    const res = await api().post('/api/auth/register').send(newUser('client', override));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('rejects unexpected fields (mass assignment)', async () => {
    const res = await api().post('/api/auth/register').send({ ...newUser('client'), isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.details[0].message).toBe('Unexpected field in request');
  });
});

describe('POST /api/auth/login', () => {
  it('returns a JWT for valid credentials', async () => {
    const details = newUser('client');
    await api().post('/api/auth/register').send(details);

    const res = await api().post('/api/auth/login').send({ email: details.email, password: details.password });

    expect(res.status).toBe(200);
    expect(res.body.token.split('.')).toHaveLength(3);
    expect(res.body.user.email).toBe(details.email);
  });

  it('gives the same message for an unknown email and a wrong password', async () => {
    const details = newUser('client');
    await api().post('/api/auth/register').send(details);

    const wrongPassword = await api().post('/api/auth/login').send({ email: details.email, password: 'Wrong!Passw0rd' });
    const unknownEmail = await api().post('/api/auth/login').send({ email: 'nobody@example.com', password: 'Wrong!Passw0rd' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error).toBe(unknownEmail.body.error);
  });

  it('locks the account after 5 failed attempts, even for the right password', async () => {
    const details = newUser('client');
    await api().post('/api/auth/register').send(details);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await api().post('/api/auth/login').send({ email: details.email, password: 'Wrong!Passw0rd' });
    }
    const res = await api().post('/api/auth/login').send({ email: details.email, password: details.password });

    expect(res.status).toBe(423);
  });

  it('blocks NoSQL operator injection in the login body', async () => {
    const res = await api().post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });

    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  it('rejects malformed JSON without leaking parser details', async () => {
    const res = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Request body must be valid JSON');
    expect(JSON.stringify(res.body)).not.toMatch(/at |node_modules|\\|\//);
  });
});

describe('protected routes', () => {
  it('rejects requests without a token', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a tampered token', async () => {
    const { token } = await createUser('client');
    const tampered = `${token.slice(0, -4)}abcd`;

    const res = await api().get('/api/auth/me').set(bearer(tampered));
    expect(res.status).toBe(401);
  });

  it('returns the profile for a valid token', async () => {
    const { token, details } = await createUser('freelancer');

    const res = await api().get('/api/auth/me').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(details.email);
  });

  it('refuses a token after logout (server-side revocation)', async () => {
    const { token } = await createUser('client');

    const logout = await api().post('/api/auth/logout').set(bearer(token));
    const reuse = await api().get('/api/auth/me').set(bearer(token));

    expect(logout.status).toBe(200);
    expect(reuse.status).toBe(401);
  });
});

describe('general security behaviour', () => {
  it('sets security headers and hides the framework', async () => {
    const res = await api().get('/health');

    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('returns a controlled 404 for unknown routes', async () => {
    const res = await api().get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Route not found', requestId: expect.any(String) });
  });
});
