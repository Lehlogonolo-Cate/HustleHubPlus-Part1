const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({ error: 'Authentication token is required' });
  }

  const parts = authorizationHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid authorization header' });
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(parts[1], process.env.JWT_SECRET, {
      issuer: 'HustleHub+',
      audience: 'HustleHub+ users'
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }

  try {
    const user = await User.findById(decodedToken.userId).select('role');

    if (!user) {
      return res.status(401).json({ error: 'Account no longer exists' });
    }

    req.user = { userId: user._id.toString(), role: user.role };
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticateToken;