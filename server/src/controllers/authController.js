const authService = require('../services/authService');
const mongoose = require('mongoose');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res) => {
  try {
    console.log('[AUTH CONTROLLER] Registration request received');
    console.log('[AUTH CONTROLLER] Request body:', JSON.stringify(req.body, null, 2));
    
    const { userType } = req.body;
    
    // Validate user type
    if (!['user', 'doctor', 'organizer', 'venue-host'].includes(userType)) {
      console.log(`[AUTH CONTROLLER] Invalid user type: ${userType}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user type. Must be user, doctor, organizer, or venue-host' 
      });
    }
    
    // Validate required fields based on user type
    if (!req.body.email || !req.body.password || !req.body.name) {
      console.log('[AUTH CONTROLLER] Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, email, and password' 
      });
    }
    
    // Additional validation for doctors
    if (userType === 'doctor' && (!req.body.regNumber || !req.body.specialty)) {
      console.log('[AUTH CONTROLLER] Missing doctor-specific fields');
      return res.status(400).json({
        success: false,
        message: 'Doctors must provide registration number and specialty'
      });
    }
    
    // Additional validation for organizers
    if (userType === 'organizer' && !req.body.companyName) {
      console.log('[AUTH CONTROLLER] Missing organizer-specific fields');
      return res.status(400).json({
        success: false,
        message: 'Organizers must provide company name'
      });
    }
    
    // Additional validation for venue hosts
    if (userType === 'venue-host' && (!req.body.venueName || !req.body.venueType)) {
      console.log('[AUTH CONTROLLER] Missing venue-host-specific fields');
      return res.status(400).json({
        success: false,
        message: 'Venue hosts must provide venue name and venue type'
      });
    }
    
    // Log database connection state
    console.log('[AUTH CONTROLLER] Checking MongoDB connection status');
    console.log('[AUTH CONTROLLER] Connection state:', mongoose.connection.readyState);
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    
    if (mongoose.connection.readyState !== 1) {
      console.error('[AUTH CONTROLLER] MongoDB is not connected!');
      return res.status(500).json({
        success: false,
        message: 'Database connection issue. Please try again later.'
      });
    }
    
    console.log('[AUTH CONTROLLER] Calling authService.register');
    const result = await authService.register(req.body, userType);
    
    // Check MongoDB for the created documents
    console.log('[AUTH CONTROLLER] Verifying created documents in MongoDB');
    
    // Return success response without sensitive information
    console.log('[AUTH CONTROLLER] Registration successful, returning response');
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        userType,
        token: result.token,
        user: {
          id: result.user._id,
          name: result.user.name,
          email: result.user.email
        }
      }
    });
    
    // Log collections after successful registration
    try {
      console.log('[AUTH CONTROLLER] Listing all collections after registration:');
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('[AUTH CONTROLLER] Collections:', collections.map(c => c.name));
    } catch (err) {
      console.error('[AUTH CONTROLLER] Error listing collections:', err);
    }
    
  } catch (error) {
    console.error('[AUTH CONTROLLER] Registration error:', error);
    console.error('[AUTH CONTROLLER] Error stack:', error.stack);
    
    // Handle duplicate key error (e.g., email already exists)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

/**
 * Login a user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    console.log('[AUTH CONTROLLER] Login request received');
    const { email, password, userType, regNumber } = req.body;
    
    if (!email || !password || !userType) {
      console.log('[AUTH CONTROLLER] Missing required login fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide email/phone, password and user type'
      });
    }
    
    // Additional validation for doctors
    if (userType === 'doctor' && !regNumber) {
      console.log('[AUTH CONTROLLER] Missing registration number for doctor login');
      return res.status(400).json({
        success: false,
        message: 'Doctors must provide registration number'
      });
    }
    
    console.log('[AUTH CONTROLLER] Calling authService.login');
    const result = await authService.login(email, password, userType, regNumber);
    
    console.log('[AUTH CONTROLLER] Login successful, returning response');
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userType: result.userType,
        token: result.token,
        user: {
          id: result.user._id,
          name: result.user.name,
          email: result.user.email
        }
      }
    });
  } catch (error) {
    console.error('[AUTH CONTROLLER] Login error:', error);
    
    // Return a user-friendly error message
    const errorMessage = error.message === 'Invalid credentials' 
      ? 'Invalid email/phone or password'
      : error.message;
    
    res.status(401).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

/**
 * Verify email
 * @route GET /api/auth/verify-email/:token
 * @access Public
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    await authService.verifyEmail(token);
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    
    res.status(400).json({
      success: false,
      message: 'Email verification failed',
      error: error.message
    });
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email'
      });
    }
    
    const resetToken = await authService.requestPasswordReset(email);
    
    // In a real application, send an email with the reset link
    // For now, just return the token in the response
    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      resetToken // Remove this in production
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Don't reveal if the email exists or not for security
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link will be sent'
    });
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password'
      });
    }
    
    await authService.resetPassword(token, password);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    
    res.status(400).json({
      success: false,
      message: 'Password reset failed',
      error: error.message
    });
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
exports.getCurrentUser = async (req, res) => {
  try {
    // This route will be protected by middleware that sets req.user
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get user data',
      error: error.message
    });
  }
}; 