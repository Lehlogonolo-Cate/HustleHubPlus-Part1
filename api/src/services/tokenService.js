const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { config } = require('../config/env');
const RevokedToken = require('../models/RevokedToken');

const signToken = (user) =>
  jwt.sign({ role: user.role }, config.jwt.secret, {
    subject: user._id.toString(),
    // A unique ID per token makes individual tokens revocable
    jwtid: crypto.randomUUID(),
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    algorithm: 'HS256'
  });

// Throws if the signature, expiry, issuer, audience or algorithm is wrong
const verifyToken = (token) =>
  jwt.verify(token, config.jwt.secret, {
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    algorithms: ['HS256']
  });

const revokeToken = async ({ jti, exp }) => {
  await RevokedToken.updateOne(
    { jti },
    { $setOnInsert: { jti, expiresAt: new Date(exp * 1000) } },
    { upsert: true }
  );
};

const isTokenRevoked = async (jti) => Boolean(await RevokedToken.exists({ jti }));

module.exports = { signToken, verifyToken, revokeToken, isTokenRevoked };
