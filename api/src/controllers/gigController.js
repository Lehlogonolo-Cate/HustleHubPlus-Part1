const gigService = require('../services/gigService');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const list = async (req, res) => {
  const result = await gigService.listGigs(req.data);
  res.status(200).json(result);
};

const listMine = async (req, res) => {
  const gigs = await gigService.listFreelancerGigs(req.user.id);
  res.status(200).json({ gigs });
};

const getOne = async (req, res) => {
  const gig = await gigService.getGig(req.data.id, req.user);
  res.status(200).json({ gig });
};

const create = async (req, res) => {
  const gig = await gigService.createGig(req.user, req.data, logger.requestContext(req));
  res.status(201).json({ message: 'Gig created', gig });
};

const update = async (req, res) => {
  const { id, ...changes } = req.data;

  if (Object.keys(changes).length === 0) {
    throw AppError.badRequest('Provide at least one field to update');
  }

  const gig = await gigService.updateGig(id, req.user, changes, logger.requestContext(req));
  res.status(200).json({ message: 'Gig updated', gig });
};

const remove = async (req, res) => {
  await gigService.deleteGig(req.data.id, req.user, logger.requestContext(req));
  res.status(200).json({ message: 'Gig deleted' });
};

module.exports = { list, listMine, getOne, create, update, remove };
