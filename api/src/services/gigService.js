const mongoose = require('mongoose');

const Gig = require('../models/Gig');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { serializeGig } = require('../utils/serializers');
const { assertOwner, isOwner } = require('./accessControl');
const { ROLES } = require('../constants');

// Search text is used in a regular expression, so special characters are escaped
// to stop users injecting patterns (including slow, catastrophic-backtracking ones)
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findGigOrThrow = async (id) => {
  const gig = await Gig.findById(id).populate('freelancer', 'name');
  if (!gig) {
    throw AppError.notFound('Gig not found');
  }
  return gig;
};

const listGigs = async ({ search, category, minPrice, maxPrice, page = 1, limit = 12 }) => {
  const filter = { isActive: true };

  // sanitizeFilter neutralises every $operator by default; mongoose.trusted() marks
  // the ones built here in server code (never taken from the request) as intended
  if (search) filter.title = mongoose.trusted({ $regex: escapeRegex(search), $options: 'i' });
  if (category) filter.category = category;
  if (minPrice !== undefined || maxPrice !== undefined) {
    const range = {};
    if (minPrice !== undefined) range.$gte = minPrice;
    if (maxPrice !== undefined) range.$lte = maxPrice;
    filter.price = mongoose.trusted(range);
  }

  const [gigs, total] = await Promise.all([
    Gig.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('freelancer', 'name'),
    Gig.countDocuments(filter)
  ]);

  return {
    gigs: gigs.map(serializeGig),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
};

const listFreelancerGigs = async (freelancerId) => {
  const gigs = await Gig.find({ freelancer: freelancerId }).sort({ createdAt: -1 }).populate('freelancer', 'name');
  return gigs.map(serializeGig);
};

const getGig = async (id, user) => {
  const gig = await findGigOrThrow(id);

  // Hidden gigs are only visible to their owner and admins
  if (!gig.isActive && !isOwner(gig.freelancer, user) && user.role !== ROLES.ADMIN) {
    throw AppError.notFound('Gig not found');
  }

  return serializeGig(gig);
};

const createGig = async (user, data, ctx) => {
  const gig = await Gig.create({ ...data, freelancer: user.id });
  await gig.populate('freelancer', 'name');
  logger.info('Gig created', { event: 'gig.created', ...ctx, gigId: gig.id });
  return serializeGig(gig);
};

const updateGig = async (id, user, changes, ctx) => {
  const gig = await findGigOrThrow(id);

  assertOwner(gig.freelancer, user);

  gig.set(changes);
  await gig.save();

  logger.info('Gig updated', { event: 'gig.updated', ...ctx, gigId: gig.id, fields: Object.keys(changes) });
  return serializeGig(gig);
};

const deleteGig = async (id, user, ctx) => {
  const gig = await findGigOrThrow(id);

  // Admins may remove any gig for moderation
  assertOwner(gig.freelancer, user, { allowAdmin: true });

  // Bookings keep their own copy of the title and price, so history survives deletion
  await gig.deleteOne();

  logger.info('Gig deleted', { event: 'gig.deleted', ...ctx, gigId: id, byRole: user.role });
};

module.exports = { listGigs, listFreelancerGigs, getGig, createGig, updateGig, deleteGig };
