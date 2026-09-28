const crypto = require('crypto');

const { config } = require('../config/env');
const { BOOKING_STATUS, TRANSACTION_STATUS } = require('../constants');
const Booking = require('../models/Booking');
const Gig = require('../models/Gig');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { roundMoney } = require('../utils/money');
const { serializeBooking } = require('../utils/serializers');
const { assertOwner, assertParticipant, participantFilter } = require('./accessControl');

const POPULATE = [
  { path: 'client', select: 'name' },
  { path: 'freelancer', select: 'name' },
  { path: 'transaction' }
];

const newReference = () => `TXN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

const findBookingOrThrow = async (id) => {
  const booking = await Booking.findById(id).populate(POPULATE);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }
  return booking;
};

// Simulates payment: no gateway is contacted and no card data is handled.
// Every booking produces exactly one transaction record linked to both users.
const createBooking = async (client, { gigId, requirements = '' }, ctx) => {
  const gig = await Gig.findOne({ _id: gigId, isActive: true });

  if (!gig) {
    throw AppError.notFound('Gig not found or no longer available');
  }

  if (gig.freelancer.toString() === client.id) {
    throw AppError.badRequest('You cannot book your own gig');
  }

  const amount = roundMoney(gig.price);
  const platformFee = roundMoney(amount * config.platformFeeRate);

  const booking = await Booking.create({
    gig: gig._id,
    gigTitle: gig.title,
    price: amount,
    client: client.id,
    freelancer: gig.freelancer,
    requirements
  });

  let transaction;
  try {
    transaction = await Transaction.create({
      reference: newReference(),
      booking: booking._id,
      gigTitle: gig.title,
      client: client.id,
      freelancer: gig.freelancer,
      amount,
      platformFee,
      freelancerEarnings: roundMoney(amount - platformFee)
    });
  } catch (error) {
    // Don't leave a booking without its transaction record
    await Booking.deleteOne({ _id: booking._id });
    throw error;
  }

  booking.transaction = transaction._id;
  await booking.save();

  logger.info('Booking created with simulated payment', {
    event: 'booking.created',
    ...ctx,
    bookingId: booking.id,
    gigId: gig.id,
    freelancerId: gig.freelancer.toString()
  });
  logger.info('Transaction recorded', {
    event: 'transaction.created',
    ...ctx,
    transactionId: transaction.id,
    reference: transaction.reference,
    amount
  });

  await booking.populate(POPULATE);
  return serializeBooking(booking);
};

const listBookings = async (user, { status } = {}) => {
  const filter = participantFilter(user);
  if (status) filter.status = status;

  const bookings = await Booking.find(filter).sort({ createdAt: -1 }).limit(200).populate(POPULATE);
  return bookings.map(serializeBooking);
};

const getBooking = async (id, user) => {
  const booking = await findBookingOrThrow(id);
  assertParticipant(booking, user);
  return serializeBooking(booking);
};

// The status condition is part of the update filter, so two simultaneous requests
// cannot both complete or cancel the same booking
const transition = async (booking, fromStatus, update) => {
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: fromStatus },
    update,
    { returnDocument: 'after' }
  ).populate(POPULATE);

  if (!updated) {
    throw AppError.conflict(`Only ${fromStatus} bookings can be changed this way`);
  }
  return updated;
};

const completeBooking = async (id, user, ctx) => {
  const booking = await findBookingOrThrow(id);
  assertOwner(booking.freelancer, user);

  const updated = await transition(booking, BOOKING_STATUS.CONFIRMED, {
    status: BOOKING_STATUS.COMPLETED,
    completedAt: new Date()
  });

  logger.info('Booking completed', { event: 'booking.completed', ...ctx, bookingId: id });
  return serializeBooking(updated);
};

const cancelBooking = async (id, user, ctx) => {
  const booking = await findBookingOrThrow(id);
  assertOwner(booking.client, user);

  const updated = await transition(booking, BOOKING_STATUS.CONFIRMED, {
    status: BOOKING_STATUS.CANCELLED,
    cancelledAt: new Date()
  });

  await Transaction.updateOne(
    { booking: booking._id, status: TRANSACTION_STATUS.PAID },
    { status: TRANSACTION_STATUS.REFUNDED, refundedAt: new Date() }
  );
  await updated.populate('transaction');

  logger.info('Booking cancelled and simulated refund issued', { event: 'booking.cancelled', ...ctx, bookingId: id });
  logger.info('Transaction refunded', { event: 'transaction.refunded', ...ctx, bookingId: id });
  return serializeBooking(updated);
};

module.exports = { createBooking, listBookings, getBooking, completeBooking, cancelBooking };
