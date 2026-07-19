const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token on protected routes
// Checks Authorization header, validates token, and attaches full user object to req.user
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Token must come in header as "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(' ')[1];
    
    // Verify token signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look up user in database (get fresh data, exclude password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found, authorization denied' });
    }

    // Attach user to request so downstream routes can access it
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
