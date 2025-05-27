const Doctor = require('../models/Doctor');

/**
 * Middleware to verify that the authenticated user is a doctor
 * This should be used after the auth middleware
 */
module.exports = async (req, res, next) => {
  try {
    // Find the doctor associated with the authenticated user
    const doctor = await Doctor.findOne({ userId: req.user.id });
    
    if (!doctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User is not a registered doctor.'
      });
    }
    
    // If doctor account is not active, deny access
    if (!doctor.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Doctor account is currently inactive.'
      });
    }
    
    // Attach doctor info to the request object
    req.doctor = doctor;
    
    next();
  } catch (error) {
    console.error('Error in doctor authentication middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during doctor authentication',
      error: error.message
    });
  }
}; 