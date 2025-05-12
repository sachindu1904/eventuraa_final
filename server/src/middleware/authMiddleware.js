const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Organizer = require('../models/Organizer');
const Admin = require('../models/Admin');
const Credentials = require('../models/Credentials');

const JWT_SECRET = process.env.JWT_SECRET || 'eventuraa-secret-key';

/**
 * Middleware to authenticate user based on JWT token
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user type and ID from token
    const { id, userType } = decoded;
    
    // Check if user exists in the appropriate model
    let user;
    switch (userType) {
      case 'user':
        user = await User.findById(id);
        break;
      case 'doctor':
        user = await Doctor.findById(id);
        break;
      case 'organizer':
        user = await Organizer.findById(id);
        break;
      case 'admin':
        user = await Admin.findById(id);
        break;
      default:
        throw new Error('Invalid user type');
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    // Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }
    
    // Add user and userType to request
    req.user = user;
    req.userType = userType;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Middleware to check if user has specific user type
 * @param {Array} allowedTypes - Array of allowed user types
 */
exports.authorizeUserType = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.userType || !allowedTypes.includes(req.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access this resource.'
      });
    }
    
    next();
  };
};

/**
 * Middleware to check if admin has specific permissions
 * @param {Array} requiredPermissions - Array of required permission keys
 */
exports.authorizeAdminPermission = (requiredPermissions) => {
  return (req, res, next) => {
    // Check if user is admin
    if (req.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    // Special case for superadmin - they have all permissions
    if (req.user.role === 'superadmin') {
      return next();
    }
    
    // Check if admin has all the required permissions
    const hasAllPermissions = requiredPermissions.every(
      permission => req.user.permissions && req.user.permissions[permission] === true
    );
    
    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have the required permissions.'
      });
    }
    
    next();
  };
}; 