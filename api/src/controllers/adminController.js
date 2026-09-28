const adminService = require('../services/adminService');
const logger = require('../utils/logger');

const listUsers = async (req, res) => {
  const result = await adminService.listUsers(req.data);
  res.status(200).json(result);
};

const setUserStatus = async (req, res) => {
  const user = await adminService.setUserStatus(req.user, req.data.id, req.data.isActive, logger.requestContext(req));
  res.status(200).json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
};

const stats = async (req, res) => {
  res.status(200).json(await adminService.getStats());
};

module.exports = { listUsers, setUserStatus, stats };
