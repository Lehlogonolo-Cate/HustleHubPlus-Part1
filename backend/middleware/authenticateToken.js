const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({
      error: 'Authentication token is required'
    });
  }

  const parts = authorizationHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Invalid authorization header'
    });
  }

  const token = parts[1];

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        issuer: 'HustleHub+',
        audience: 'HustleHub+ users'
      }
    );

    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired authentication token'
    });
  }
};

module.exports = authenticateToken;