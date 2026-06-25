const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    } else {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_access_token_key_12345');
      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User associated with token no longer exists',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'This account has been deactivated',
        });
      }

      req.user = user;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token verification failed',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server auth middleware error',
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'guest'}) is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = { verifyToken, authorizeRoles };
