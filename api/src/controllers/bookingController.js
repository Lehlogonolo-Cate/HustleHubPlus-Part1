const bookingService = require('../services/bookingService');
const logger = require('../utils/logger');

const create = async (req, res) => {
  const booking = await bookingService.createBooking(req.user, req.data, logger.requestContext(req));
  res.status(201).json({ message: 'Booking confirmed. Simulated payment successful.', booking });
};

const list = async (req, res) => {
  const bookings = await bookingService.listBookings(req.user, req.data);
  res.status(200).json({ bookings });
};

const getOne = async (req, res) => {
  const booking = await bookingService.getBooking(req.data.id, req.user);
  res.status(200).json({ booking });
};

const complete = async (req, res) => {
  const booking = await bookingService.completeBooking(req.data.id, req.user, logger.requestContext(req));
  res.status(200).json({ message: 'Booking marked as completed', booking });
};

const cancel = async (req, res) => {
  const booking = await bookingService.cancelBooking(req.data.id, req.user, logger.requestContext(req));
  res.status(200).json({ message: 'Booking cancelled. Simulated refund issued.', booking });
};

module.exports = { create, list, getOne, complete, cancel };
