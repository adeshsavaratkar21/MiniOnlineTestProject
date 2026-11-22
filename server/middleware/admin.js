const mongoose = require('mongoose');
const User = require('../models/User');
const localDB = require('../utils/localStore');

const isMongooseReady = () => mongoose.connection.readyState === 1;

/**
 * Middleware to restrict route access strictly to users with the 'admin' role.
 * Requires authMiddleware to run first so that req.userId is set.
 */
const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authorization required. Please log in.' });
    }

    // Fast check if role is already confirmed in verified JWT payload
    if (req.userRole === 'admin') {
      return next();
    }

    // Otherwise, double-check in database
    let role = 'student';
    if (isMongooseReady()) {
      const user = await User.findById(req.userId).select('role email');
      if (user) {
        role = user.role || (user.email === 'admin@example.com' ? 'admin' : 'student');
      }
    } else {
      const user = localDB.findUserById(req.userId);
      if (user) {
        role = user.role || (user.email === 'admin@example.com' ? 'admin' : 'student');
      }
    }

    if (role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied. Administrator privileges required.'
      });
    }

    req.userRole = 'admin';
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ message: 'Server error verifying administrator privileges.' });
  }
};

module.exports = adminMiddleware;
