// Explicit allow-lists of fields that may leave the API. Returning whole
// documents risks leaking fields such as password hashes or lockout counters.

const toId = (value) => (value && value._id ? value._id.toString() : value?.toString());

const userSummary = (user) =>
  user && user._id ? { id: user._id.toString(), name: user.name } : { id: toId(user) };

const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt
});

const serializeGig = (gig) => ({
  id: gig._id.toString(),
  title: gig.title,
  description: gig.description,
  category: gig.category,
  price: gig.price,
  deliveryDays: gig.deliveryDays,
  isActive: gig.isActive,
  freelancer: userSummary(gig.freelancer),
  createdAt: gig.createdAt,
  updatedAt: gig.updatedAt
});

const serializeTransaction = (transaction) => ({
  id: transaction._id.toString(),
  reference: transaction.reference,
  booking: toId(transaction.booking),
  gigTitle: transaction.gigTitle,
  client: userSummary(transaction.client),
  freelancer: userSummary(transaction.freelancer),
  amount: transaction.amount,
  platformFee: transaction.platformFee,
  freelancerEarnings: transaction.freelancerEarnings,
  currency: transaction.currency,
  paymentMethod: transaction.paymentMethod,
  status: transaction.status,
  paidAt: transaction.paidAt,
  refundedAt: transaction.refundedAt
});

const serializeBooking = (booking) => ({
  id: booking._id.toString(),
  gig: toId(booking.gig),
  gigTitle: booking.gigTitle,
  price: booking.price,
  requirements: booking.requirements,
  status: booking.status,
  client: userSummary(booking.client),
  freelancer: userSummary(booking.freelancer),
  transaction:
    booking.transaction && booking.transaction._id
      ? serializeTransaction(booking.transaction)
      : toId(booking.transaction),
  completedAt: booking.completedAt,
  cancelledAt: booking.cancelledAt,
  createdAt: booking.createdAt
});

module.exports = { serializeUser, serializeGig, serializeBooking, serializeTransaction };
