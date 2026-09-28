const { startDatabase, clearDatabase, stopDatabase } = require('../helpers/db');
const { api, createUser, createAdmin, createGig, bearer } = require('../helpers/factory');
const Transaction = require('../../src/models/Transaction');

beforeAll(startDatabase);
afterEach(clearDatabase);
afterAll(stopDatabase);

const setup = async () => {
  const freelancer = await createUser('freelancer');
  const client = await createUser('client');
  const gig = await createGig(freelancer.token, { price: 1000 });
  return { freelancer, client, gig };
};

const book = (token, gigId, extra = {}) =>
  api().post('/api/bookings').set(bearer(token)).send({ gigId, requirements: 'Blue and white colours', ...extra });

describe('POST /api/bookings', () => {
  it('creates a booking and a linked transaction record', async () => {
    const { client, freelancer, gig } = await setup();

    const res = await book(client.token, gig.id);

    expect(res.status).toBe(201);
    const { booking } = res.body;
    expect(booking.status).toBe('confirmed');
    expect(booking.client.id).toBe(client.user.id);
    expect(booking.freelancer.id).toBe(freelancer.user.id);
    expect(booking.transaction).toMatchObject({
      amount: 1000,
      platformFee: 100,
      freelancerEarnings: 900,
      paymentMethod: 'simulated',
      status: 'paid'
    });
    expect(booking.transaction.reference).toMatch(/^TXN-/);
    expect(await Transaction.countDocuments()).toBe(1);
  });

  it('only allows clients to book', async () => {
    const { freelancer, gig } = await setup();
    const res = await book(freelancer.token, gig.id);
    expect(res.status).toBe(403);
  });

  it('refuses to book an inactive gig', async () => {
    const { client, freelancer } = await setup();
    const hidden = await createGig(freelancer.token, { isActive: false });

    const res = await book(client.token, hidden.id);
    expect(res.status).toBe(404);
  });

  it('ignores a client-supplied price (the server uses the gig price)', async () => {
    const { client, gig } = await setup();
    const res = await book(client.token, gig.id, { price: 1 });
    expect(res.status).toBe(400);
  });
});

describe('viewing bookings', () => {
  it('shows each participant only their own bookings', async () => {
    const { client, freelancer, gig } = await setup();
    const otherClient = await createUser('client');
    await book(client.token, gig.id);
    await book(otherClient.token, gig.id);

    const clientView = await api().get('/api/bookings').set(bearer(client.token));
    const freelancerView = await api().get('/api/bookings').set(bearer(freelancer.token));

    expect(clientView.body.bookings).toHaveLength(1);
    expect(freelancerView.body.bookings).toHaveLength(2);
  });

  it('forbids a non-participant from opening a booking', async () => {
    const { client, gig } = await setup();
    const outsider = await createUser('client');
    const { body } = await book(client.token, gig.id);

    const res = await api().get(`/api/bookings/${body.booking.id}`).set(bearer(outsider.token));
    expect(res.status).toBe(403);
  });

  it('lets an admin open any booking', async () => {
    const { client, gig } = await setup();
    const admin = await createAdmin();
    const { body } = await book(client.token, gig.id);

    const res = await api().get(`/api/bookings/${body.booking.id}`).set(bearer(admin.token));
    expect(res.status).toBe(200);
  });
});

describe('booking status changes', () => {
  it('lets the assigned freelancer complete a booking', async () => {
    const { client, freelancer, gig } = await setup();
    const { body } = await book(client.token, gig.id);

    const res = await api().patch(`/api/bookings/${body.booking.id}/complete`).set(bearer(freelancer.token));

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('completed');
  });

  it('forbids a different freelancer from completing it', async () => {
    const { client, gig } = await setup();
    const otherFreelancer = await createUser('freelancer');
    const { body } = await book(client.token, gig.id);

    const res = await api().patch(`/api/bookings/${body.booking.id}/complete`).set(bearer(otherFreelancer.token));
    expect(res.status).toBe(403);
  });

  it('cancels a booking and refunds its transaction', async () => {
    const { client, gig } = await setup();
    const { body } = await book(client.token, gig.id);

    const res = await api().patch(`/api/bookings/${body.booking.id}/cancel`).set(bearer(client.token));

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('cancelled');
    expect(res.body.booking.transaction.status).toBe('refunded');
  });

  it('does not allow a booking to change state twice', async () => {
    const { client, gig } = await setup();
    const { body } = await book(client.token, gig.id);

    await api().patch(`/api/bookings/${body.booking.id}/cancel`).set(bearer(client.token));
    const again = await api().patch(`/api/bookings/${body.booking.id}/cancel`).set(bearer(client.token));

    expect(again.status).toBe(409);
  });
});

describe('GET /api/transactions', () => {
  it('scopes transactions to the signed-in user', async () => {
    const { client, freelancer, gig } = await setup();
    const outsider = await createUser('client');
    await book(client.token, gig.id);

    const mine = await api().get('/api/transactions').set(bearer(freelancer.token));
    const theirs = await api().get('/api/transactions').set(bearer(outsider.token));

    expect(mine.body.transactions).toHaveLength(1);
    expect(theirs.body.transactions).toHaveLength(0);
  });
});
