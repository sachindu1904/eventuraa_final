const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const JWT_SECRET = process.env.JWT_SECRET || 'eventuraa-secret-key';

/**
 * Middleware to authenticate doctor based on JWT token
 */
module.exports = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH] Missing or invalid Authorization header');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('[AUTH] Got token, verifying...');
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('[AUTH] Token verified, user ID:', decoded.id);
    } catch (tokenError) {
      console.error('[AUTH] Token verification failed:', tokenError.message);
      return res.status(401).json({
        success: false,
        message: tokenError.name === 'TokenExpiredError' 
          ? 'Token expired' 
          : 'Invalid token'
      });
    }
    
    // Get user ID from token
    const userId = decoded.id;
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      console.log(`[AUTH] User not found with ID: ${userId}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    console.log(`[AUTH] User found: ${user.name}, role: ${user.role}`);
    
    // Check if user is active
    if (user.isActive === false) {
      console.log(`[AUTH] User account is inactive: ${userId}`);
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }
    
    // Check if user is a doctor
    if (user.role !== 'doctor') {
      console.log(`[AUTH] User is not a doctor, role is: ${user.role}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Doctor privileges required.'
      });
    }
    
    // Find doctor profile - using email as a connection field if userId is not present
    console.log(`[AUTH] Looking for doctor profile for user ${userId} or email ${user.email}`);
    const doctor = await Doctor.findOne({ 
      $or: [
        { userId: user._id },
        { email: user.email }
      ]
    });
    
    if (!doctor) {
      console.log(`[AUTH] No doctor profile found for user ${userId} or email ${user.email}`);
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found.'
      });
    }
    
    console.log(`[AUTH] Found doctor profile: ${doctor.name}, ID: ${doctor._id}`);
    
    // Add user and doctor to request
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    req.doctor = doctor;
    req.user.doctorId = doctor._id;
    
    console.log('[AUTH] Authentication successful, proceeding to next middleware');
    next();
  } catch (error) {
    console.error('Doctor authentication error:', error);
    
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