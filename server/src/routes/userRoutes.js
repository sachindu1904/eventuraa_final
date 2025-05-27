const router = require('express').Router();
const Appointment = require('../models/Appointment');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/users/appointments
 * @desc    Get appointments for the logged in user
 * @access  Private (User only)
 */
router.get('/appointments', authenticate, async (req, res) => {
  try {
    // User info is already attached by the middleware
    const userId = req.user.id;

    const { status, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query conditions
    const conditions = { userId };
    
    if (status) {
      conditions.status = status;
    }

    // Get appointments
    const appointments = await Appointment.find(conditions)
      .sort({ appointmentDate: -1, appointmentTime: -1 }) // Most recent first
      .skip(skip)
      .limit(parseInt(limit))
      .populate('doctorId', 'name specialty email')
      .populate('location', 'name address city phone')
      .lean();

    // Get total count for pagination
    const total = await Appointment.countDocuments(conditions);

    return res.status(200).json({
      success: true,
      data: {
        appointments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router; 