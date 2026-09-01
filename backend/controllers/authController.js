const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const users = require('../data/users');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const normalisedEmail = email.toLowerCase();

    const existingUser = users.find(
      (user) => user.email === normalisedEmail
    );

    if (existingUser) {
      return res.status(409).json({
        error: 'An account with this email already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = {
      id: randomUUID(),
      name,
      email: normalisedEmail,
      passwordHash,
      role,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const normalisedEmail = email.toLowerCase();

    const user = users.find(
      (item) => item.email === normalisedEmail
    );

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        issuer: 'HustleHub+',
        audience: 'HustleHub+ users'
      }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = (req, res) => {
  const user = users.find(
    (item) => item.id === req.user.userId
  );

  if (!user) {
    return res.status(404).json({
      error: 'User profile not found'
    });
  }

  return res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  });
};

module.exports = {
  register,
  login,
  getProfile
};