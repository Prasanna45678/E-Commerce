const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Authorization header missing'
      });
    }

    // Check Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Invalid authorization format'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Token not provided'
      });
    }

    // Debug logs
    console.log('━━━━━━━━━━━━━━━━━━━━');
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    console.log('TOKEN:', token.substring(0, 30) + '...');
    console.log('━━━━━━━━━━━━━━━━━━━━');

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log('USER AUTHENTICATED:', decoded);

    // Attach user to request
    req.user = decoded;

    next();
  } catch (err) {
    console.error('JWT ERROR:', err.message);

    return res.status(403).json({
      error: 'Invalid or expired token',
      details: err.message
    });
  }
};

module.exports = authMiddleware;