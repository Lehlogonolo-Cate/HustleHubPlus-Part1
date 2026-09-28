// Must be set before the app (and its rate limiters) are loaded
process.env.RATE_LIMIT_AUTH = '3';

const { startDatabase, stopDatabase } = require('../helpers/db');
const { api } = require('../helpers/factory');

beforeAll(startDatabase);
afterAll(stopDatabase);

describe('authentication rate limiting', () => {
  it('returns 429 once the login limit is exceeded', async () => {
    const attempt = () => api().post('/api/auth/login').send({ email: 'someone@example.com', password: 'Wrong!Passw0rd' });

    const statuses = [];
    for (let i = 0; i < 4; i += 1) {
      statuses.push((await attempt()).status);
    }

    expect(statuses).toEqual([401, 401, 401, 429]);
  });
});
