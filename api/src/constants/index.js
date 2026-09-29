const ROLES = Object.freeze({
  CLIENT: 'client',
  FREELANCER: 'freelancer',
  ADMIN: 'admin'
});

// Admin accounts are never created through public registration
const SELF_REGISTER_ROLES = Object.freeze([ROLES.CLIENT, ROLES.FREELANCER]);

const GIG_CATEGORIES = Object.freeze([
  'design',
  'development',
  'writing',
  'marketing',
  'video',
  'music',
  'business',
  'other'
]);

const BOOKING_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
});

const TRANSACTION_STATUS = Object.freeze({
  PAID: 'paid',
  REFUNDED: 'refunded'
});

const AGE_GROUPS = Object.freeze(['under65', '65to74', '75plus']);

module.exports = {
  ROLES,
  SELF_REGISTER_ROLES,
  GIG_CATEGORIES,
  BOOKING_STATUS,
  TRANSACTION_STATUS,
  AGE_GROUPS
};
