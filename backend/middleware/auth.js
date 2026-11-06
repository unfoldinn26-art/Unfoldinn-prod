const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(req) {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}

/**
 * Strict Admin route protection middleware
 */
const protectAdmin = async (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, admin authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Reject tokens explicitly issued for regular mentee users
    if (decoded.tokenType === 'user') {
      return res.status(403).json({ success: false, error: 'Forbidden: User token cannot access admin resources' });
    }

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, error: 'Not authorized, admin account inactive or not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Not authorized, invalid or expired admin token' });
  }
};

/**
 * Optional Admin check (for public routes that return extra draft/inactive items only when admin is logged in)
 */
const optionalAdmin = async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.tokenType !== 'user') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (admin && admin.isActive) {
        req.admin = admin;
      }
    }
  } catch (_) {
    // Ignore invalid token on public read route
  }
  next();
};

/**
 * Strict Mentee User route protection middleware
 */
const protectUser = async (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ success: false, error: 'Please sign in to your Unfoldinn account to continue' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.tokenType !== 'user') {
      return res.status(401).json({ success: false, error: 'Invalid user session token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'User account not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Session expired. Please sign in again.' });
  }
};

/**
 * Optional User or Admin attachment (attaches req.user or req.admin if present)
 */
const optionalAuth = async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.tokenType === 'user') {
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    } else {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (admin && admin.isActive) {
        req.admin = admin;
      }
    }
  } catch (_) {
    // Ignore invalid token on optional routes
  }
  next();
};

module.exports = {
  protect: protectAdmin,
  protectAdmin,
  optionalAdmin,
  protectUser,
  optionalAuth
};
