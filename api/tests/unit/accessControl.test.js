const { assertOwner, assertParticipant, participantFilter } = require('../../src/services/accessControl');

const freelancer = { id: 'f1', role: 'freelancer' };
const otherFreelancer = { id: 'f2', role: 'freelancer' };
const client = { id: 'c1', role: 'client' };
const admin = { id: 'a1', role: 'admin' };

describe('assertOwner', () => {
  it('allows the owner', () => {
    expect(() => assertOwner('f1', freelancer)).not.toThrow();
  });

  it('blocks a different user with the same role', () => {
    expect(() => assertOwner('f1', otherFreelancer)).toThrow('You can only access your own records');
  });

  it('blocks admins unless explicitly allowed', () => {
    expect(() => assertOwner('f1', admin)).toThrow();
    expect(() => assertOwner('f1', admin, { allowAdmin: true })).not.toThrow();
  });
});

describe('assertParticipant', () => {
  const booking = { client: 'c1', freelancer: 'f1' };

  it('allows the client, the freelancer and admins', () => {
    expect(() => assertParticipant(booking, client)).not.toThrow();
    expect(() => assertParticipant(booking, freelancer)).not.toThrow();
    expect(() => assertParticipant(booking, admin)).not.toThrow();
  });

  it('blocks anyone else', () => {
    expect(() => assertParticipant(booking, otherFreelancer)).toThrow();
  });
});

describe('participantFilter', () => {
  it('scopes list queries by role', () => {
    expect(participantFilter(client)).toEqual({ client: 'c1' });
    expect(participantFilter(freelancer)).toEqual({ freelancer: 'f1' });
    expect(participantFilter(admin)).toEqual({});
  });
});
