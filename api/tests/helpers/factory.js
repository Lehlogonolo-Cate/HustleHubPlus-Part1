const request = require('supertest');

const createApp = require('../../src/app');
const seedAdmin = require('../../scripts/seedAdmin');

const app = createApp();
const api = () => request(app);

const PASSWORD = 'Str0ng!Passw0rd';
let counter = 0;

const newUser = (role, overrides = {}) => {
  counter += 1;
  return {
    name: `Test ${role}`,
    email: `${role}${counter}-${Date.now()}@example.com`,
    password: PASSWORD,
    role,
    ...overrides
  };
};

const login = async (email, password = PASSWORD) => {
  const res = await api().post('/api/auth/login').send({ email, password });
  return res.body.token;
};

// Registers a user through the real API and returns their token and profile
const createUser = async (role, overrides) => {
  const details = newUser(role, overrides);
  const res = await api().post('/api/auth/register').send(details);
  const token = await login(details.email, details.password);
  return { token, user: res.body.user, details };
};

const createAdmin = async () => {
  counter += 1;
  const email = `admin${counter}@example.com`;
  const password = 'Admin@Passw0rd!';
  await seedAdmin({ email, password });
  return { token: await login(email, password), email };
};

const validGig = (overrides = {}) => ({
  title: 'Professional logo design',
  description: 'I will design a clean, modern logo for your brand with three revisions.',
  category: 'design',
  price: 1500,
  deliveryDays: 5,
  ...overrides
});

const createGig = async (token, overrides) => {
  const res = await api().post('/api/gigs').set('Authorization', `Bearer ${token}`).send(validGig(overrides));
  return res.body.gig;
};

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = { app, api, PASSWORD, newUser, login, createUser, createAdmin, validGig, createGig, bearer };
