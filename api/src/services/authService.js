const bcrypt = require('bcryptjs');

const { config } = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { serializeUser } = require('../utils/serializers');
const tokenService = require('./tokenService');

const INVALID_CREDENTIALS = 'Invalid email or password';

// Compared against when the email does not exist, so a missing account takes as
// long to reject as a wrong password and response times don't reveal valid emails
let dummyHash;
const getDummyHash = async () => {
  dummyHash = dummyHash || (await bcrypt.hash('dummy-password-for-timing', config.bcryptRounds));
  return dummyHash;
};

const register = async ({ name, email, password, role }, ctx) => {
  if (await User.exists({ email })) {
    logger.warn('Registration rejected: email already registered', { event: 'auth.register.duplicate', ...ctx });
    throw AppError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

  try {
    const user = await User.create({ name, email, passwordHash, role });
    logger.info('User registered', { event: 'auth.register.success', ...ctx, userId: user.id, role });
    return serializeUser(user);
  } catch (error) {
    // Two simultaneous requests can both pass the check above; the unique index catches the second
    if (error.code === 11000) {
      throw AppError.conflict('An account with this email already exists');
    }
    throw error;
  }
};

const registerFailedAttempt = async (user, ctx) => {
  const attempts = user.failedLoginAttempts + 1;
  const update = { failedLoginAttempts: attempts };

  if (attempts >= config.lockout.maxAttempts) {
    update.failedLoginAttempts = 0;
    update.lockUntil = new Date(Date.now() + config.lockout.durationMinutes * 60 * 1000);
    logger.warn('Account locked after repeated failed logins', {
      event: 'auth.lockout',
      ...ctx,
      userId: user.id,
      lockedUntil: update.lockUntil
    });
  }

  await User.updateOne({ _id: user._id }, update);
};

const login = async ({ email, password }, ctx) => {
  const user = await User.findOne({ email }).select('+passwordHash +failedLoginAttempts +lockUntil');

  if (!user) {
    await bcrypt.compare(password, await getDummyHash());
    logger.warn('Login failed: unknown email', { event: 'auth.login.failure', reason: 'unknown_email', ...ctx });
    throw AppError.unauthorized(INVALID_CREDENTIALS);
  }

  if (user.isLocked()) {
    logger.warn('Login blocked: account locked', { event: 'auth.login.blocked', ...ctx, userId: user.id });
    throw new AppError(423, 'This account is temporarily locked after too many failed attempts. Try again later.');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    await registerFailedAttempt(user, ctx);
    logger.warn('Login failed: wrong password', { event: 'auth.login.failure', reason: 'bad_password', ...ctx, userId: user.id });
    throw AppError.unauthorized(INVALID_CREDENTIALS);
  }

  if (!user.isActive) {
    logger.warn('Login blocked: account deactivated', { event: 'auth.login.blocked', ...ctx, userId: user.id });
    throw AppError.forbidden('This account has been deactivated. Contact support.');
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { failedLoginAttempts: 0, lastLoginAt: new Date() }, $unset: { lockUntil: 1 } }
  );

  logger.info('Login succeeded', { event: 'auth.login.success', ...ctx, userId: user.id, role: user.role });

  return { token: tokenService.signToken(user), user: serializeUser(user) };
};

const logout = async (tokenPayload, ctx) => {
  await tokenService.revokeToken(tokenPayload);
  logger.info('User logged out; token revoked', { event: 'auth.logout', ...ctx });
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw AppError.notFound('User profile not found');
  }

  return serializeUser(user);
};

module.exports = { register, login, logout, getProfile };
