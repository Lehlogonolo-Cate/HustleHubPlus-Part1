const { startDatabase, clearDatabase, stopDatabase } = require('../helpers/db');
const { api, createUser, createAdmin, createGig, validGig, bearer } = require('../helpers/factory');

beforeAll(startDatabase);
afterEach(clearDatabase);
afterAll(stopDatabase);

describe('creating gigs', () => {
  it('lets a freelancer create a gig they own', async () => {
    const { token, user } = await createUser('freelancer');

    const res = await api().post('/api/gigs').set(bearer(token)).send(validGig());

    expect(res.status).toBe(201);
    expect(res.body.gig.freelancer.id).toBe(user.id);
  });

  it('forbids clients from creating gigs (role check)', async () => {
    const { token } = await createUser('client');

    const res = await api().post('/api/gigs').set(bearer(token)).send(validGig());
    expect(res.status).toBe(403);
  });

  it('rejects an attempt to set a different owner (mass assignment)', async () => {
    const { token } = await createUser('freelancer');
    const other = await createUser('freelancer');

    const res = await api().post('/api/gigs').set(bearer(token)).send(validGig({ freelancer: other.user.id }));
    expect(res.status).toBe(400);
  });

  it('strips HTML so stored gigs cannot carry scripts (stored XSS)', async () => {
    const { token } = await createUser('freelancer');

    const res = await api()
      .post('/api/gigs')
      .set(bearer(token))
      .send(validGig({ title: 'Logo design <script>alert("x")</script>', description: '<img src=x onerror=alert(1)>A detailed and careful logo design service.' }));

    expect(res.status).toBe(201);
    expect(res.body.gig.title).toBe('Logo design');
    expect(res.body.gig.description).not.toMatch(/<|onerror/);
  });

  it.each([
    ['price below minimum', { price: 10 }],
    ['price with three decimals', { price: 100.123 }],
    ['unknown category', { category: 'hacking' }],
    ['short description', { description: 'too short' }],
    ['delivery days out of range', { deliveryDays: 365 }]
  ])('rejects %s', async (_label, override) => {
    const { token } = await createUser('freelancer');
    const res = await api().post('/api/gigs').set(bearer(token)).send(validGig(override));
    expect(res.status).toBe(400);
  });
});

describe('browsing gigs', () => {
  it('lists active gigs with search and pagination', async () => {
    const { token } = await createUser('freelancer');
    await createGig(token, { title: 'Website development' });
    await createGig(token, { title: 'Logo design package' });
    await createGig(token, { title: 'Hidden gig title', isActive: false });
    const client = await createUser('client');

    const all = await api().get('/api/gigs').set(bearer(client.token));
    const search = await api().get('/api/gigs?search=logo').set(bearer(client.token));

    expect(all.body.gigs).toHaveLength(2);
    expect(all.body.pagination.total).toBe(2);
    expect(search.body.gigs.map((g) => g.title)).toEqual(['Logo design package']);
  });

  it('treats regex characters in search as plain text', async () => {
    const { token } = await createUser('client');
    const res = await api().get('/api/gigs?search=.*').set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.gigs).toHaveLength(0);
  });

  it('does not build operator objects from the query string', async () => {
    const { token } = await createUser('client');
    const res = await api().get('/api/gigs?category[$ne]=design').set(bearer(token));

    expect(res.status).toBe(400);
  });

  it('rejects an invalid ID without a database error', async () => {
    const { token } = await createUser('client');
    const res = await api().get('/api/gigs/not-an-id').set(bearer(token));

    expect(res.status).toBe(400);
  });
});

describe('ownership checks', () => {
  it('lets the owner update their gig', async () => {
    const owner = await createUser('freelancer');
    const gig = await createGig(owner.token);

    const res = await api().patch(`/api/gigs/${gig.id}`).set(bearer(owner.token)).send({ price: 2000 });

    expect(res.status).toBe(200);
    expect(res.body.gig.price).toBe(2000);
  });

  it('forbids another freelancer from updating or deleting the gig', async () => {
    const owner = await createUser('freelancer');
    const intruder = await createUser('freelancer');
    const gig = await createGig(owner.token);

    const update = await api().patch(`/api/gigs/${gig.id}`).set(bearer(intruder.token)).send({ price: 60 });
    const remove = await api().delete(`/api/gigs/${gig.id}`).set(bearer(intruder.token));

    expect(update.status).toBe(403);
    expect(remove.status).toBe(403);
  });

  it('hides inactive gigs from everyone except the owner', async () => {
    const owner = await createUser('freelancer');
    const client = await createUser('client');
    const gig = await createGig(owner.token, { isActive: false });

    expect((await api().get(`/api/gigs/${gig.id}`).set(bearer(client.token))).status).toBe(404);
    expect((await api().get(`/api/gigs/${gig.id}`).set(bearer(owner.token))).status).toBe(200);
  });

  it('lists only the freelancer’s own gigs on /mine', async () => {
    const first = await createUser('freelancer');
    const second = await createUser('freelancer');
    await createGig(first.token);
    await createGig(second.token);

    const res = await api().get('/api/gigs/mine').set(bearer(first.token));

    expect(res.body.gigs).toHaveLength(1);
    expect(res.body.gigs[0].freelancer.id).toBe(first.user.id);
  });

  it('allows an admin to remove any gig (moderation)', async () => {
    const owner = await createUser('freelancer');
    const admin = await createAdmin();
    const gig = await createGig(owner.token);

    const res = await api().delete(`/api/gigs/${gig.id}`).set(bearer(admin.token));
    expect(res.status).toBe(200);
  });

  it('rejects an empty update', async () => {
    const owner = await createUser('freelancer');
    const gig = await createGig(owner.token);

    const res = await api().patch(`/api/gigs/${gig.id}`).set(bearer(owner.token)).send({});
    expect(res.status).toBe(400);
  });
});
