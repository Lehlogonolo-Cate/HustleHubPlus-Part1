const { ROLES } = require('../constants');
const AppError = require('../utils/AppError');

const ownerId = (ref) => (ref && ref._id ? ref._id.toString() : ref.toString());

// Role checks decide WHAT kind of action a user may take. Ownership checks decide
// WHICH records they may take it on. Both are needed: a freelancer may edit gigs,
// but only their own.
const isOwner = (ownerRef, user) => ownerId(ownerRef) === user.id;

const assertOwner = (ownerRef, user, { allowAdmin = false } = {}) => {
  if (isOwner(ownerRef, user) || (allowAdmin && user.role === ROLES.ADMIN)) {
    return;
  }
  throw AppError.forbidden('You can only access your own records');
};

const assertParticipant = (record, user) => {
  if (user.role === ROLES.ADMIN || isOwner(record.client, user) || isOwner(record.freelancer, user)) {
    return;
  }
  throw AppError.forbidden('You can only access your own records');
};

// Filter that limits list queries to the records a user is part of
const participantFilter = (user) => {
  if (user.role === ROLES.CLIENT) return { client: user.id };
  if (user.role === ROLES.FREELANCER) return { freelancer: user.id };
  return {};
};

module.exports = { isOwner, assertOwner, assertParticipant, participantFilter };
