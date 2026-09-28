const { startDatabase, clearDatabase, stopDatabase } = require('../helpers/db');
const { api, createUser, createAdmin, createGig, bearer } = require('../helpers/factory');

beforeAll(startDatabase);
afterEach(clearDatabase);
afterAll(stopDatabase);

describe('GET /api/finance/summary', () => {
  it('summarises the freelancer’s income and estimates tax', async () => {
    const freelancer = await createUser('freelancer');
    const client = await createUser('client');
    const gig = await createGig(freelancer.token, { price: 2000 });

    await api().post('/api/bookings').set(bearer(client.token)).send({ gigId: gig.id });
    await api().post('/api/bookings').set(bearer(client.token)).send({ gigId: gig.id });

    const res = await api().get('/api/finance/summary').set(bearer(freelancer.token));

    expect(res.status).toBe(200);
    expect(res.body.totals).toMatchObject({ gross: 4000, fees: 400, earnings: 3600, transactions: 2 });
    expect(res.body.monthly).toHaveLength(12);
    expect(res.body.tax.yearToDate.taxableIncome).toBe(3600);
    expect(res.body.tax.projected).toHaveProperty('tax');
    expect(res.body.bookings.confirmed).toBe(2);
  });

  it('excludes refunded transactions from income', async () => {
    const freelancer = await createUser('freelancer');
    const client = await createUser('client');
    const gig = await createGig(freelancer.token, { price: 2000 });
    const { body } = await api().post('/api/bookings').set(bearer(client.token)).send({ gigId: gig.id });
    await api().patch(`/api/bookings/${body.booking.id}/cancel`).set(bearer(client.token));

    const res = await api().get('/api/finance/summary').set(bearer(freelancer.token));

    expect(res.body.totals.earnings).toBe(0);
  });

  it('accepts deductions and an age group', async () => {
    const freelancer = await createUser('freelancer');
    const res = await api()
      .get('/api/finance/summary?ageGroup=65to74&deductions=1000')
      .set(bearer(freelancer.token));

    expect(res.status).toBe(200);
    expect(res.body.tax.ageGroup).toBe('65to74');
    expect(res.body.tax.deductions).toBe(1000);
  });

  it('is only available to freelancers', async () => {
    const client = await createUser('client');
    const res = await api().get('/api/finance/summary').set(bearer(client.token));
    expect(res.status).toBe(403);
  });
});

describe('admin routes', () => {
  it('lists users for admins only', async () => {
    const admin = await createAdmin();
    const client = await createUser('client');

    const asAdmin = await api().get('/api/admin/users').set(bearer(admin.token));
    const asClient = await api().get('/api/admin/users').set(bearer(client.token));

    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body.users.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(asAdmin.body)).not.toMatch(/passwordHash/);
    expect(asClient.status).toBe(403);
  });

  it('deactivating a user blocks their existing token immediately', async () => {
    const admin = await createAdmin();
    const client = await createUser('client');

    const res = await api()
      .patch(`/api/admin/users/${client.user.id}/status`)
      .set(bearer(admin.token))
      .send({ isActive: false });
    const afterwards = await api().get('/api/auth/me').set(bearer(client.token));
    const login = await api().post('/api/auth/login').send({ email: client.details.email, password: client.details.password });

    expect(res.status).toBe(200);
    expect(afterwards.status).toBe(401);
    expect(login.status).toBe(403);
  });

  it('stops admins from deactivating themselves', async () => {
    const admin = await createAdmin();
    const me = await api().get('/api/auth/me').set(bearer(admin.token));

    const res = await api()
      .patch(`/api/admin/users/${me.body.user.id}/status`)
      .set(bearer(admin.token))
      .send({ isActive: false });

    expect(res.status).toBe(400);
  });

  it('returns platform statistics', async () => {
    const admin = await createAdmin();
    const res = await api().get('/api/admin/stats').set(bearer(admin.token));

    expect(res.status).toBe(200);
    expect(res.body.users.admin).toBe(1);
  });
});
