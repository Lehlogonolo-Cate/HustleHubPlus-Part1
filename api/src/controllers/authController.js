const authService = require('../services/authService');
const logger = require('../utils/logger');

const register = async (req, res) => {
  const user = await authService.register(req.data, logger.requestContext(req));
  res.status(201).json({ message: 'Registration successful', user });
};

const login = async (req, res) => {
  const { token, user } = await authService.login(req.data, logger.requestContext(req));
  res.status(200).json({ message: 'Login successful', token, user });
};

const logout = async (req, res) => {
  await authService.logout(req.token, logger.requestContext(req));
  res.status(200).json({ message: 'Logged out' });
};

const me = async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.status(200).json({ user });
};

module.exports = { register, login, logout, me };
