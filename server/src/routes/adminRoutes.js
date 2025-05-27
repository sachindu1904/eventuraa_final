const express = require('express');
const router = express.Router();
const { authenticate, authorizeUserType, authorizeAdminPermission } = require('../middleware/authMiddleware');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Doctor = require('../models/Doctor');
const Event = require('../models/Event');
const Venue = require('../models/Venue');
const VenueHost = require('../models/VenueHost');
const bcrypt = require('bcryptjs');

/**
 * @route GET /api/admin/profile
 * @desc Get admin profile
 * @access Private (Admin only)
 */
router.get('/profile', authenticate, authorizeUserType(['admin']), async (req, res) => {
  try {
    const admin = req.user;

    res.status(200).json({
      success: true,
      message: 'Admin profile retrieved successfully',
      data: {
        admin
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin profile',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/dashboard-stats
 * @desc Get admin dashboard statistics
 * @access Private (Admin only)
 */
router.get('/dashboard-stats', authenticate, authorizeUserType(['admin']), async (req, res) => {
  try {
    // Get counts from different collections
    const userCount = await User.countDocuments();
    const organizerCount = await Organizer.countDocuments();
    const doctorCount = await Doctor.countDocuments();
    const eventCount = await Event.countDocuments();
    const venueHostCount = await VenueHost.countDocuments();
    const venueCount = await Venue.countDocuments();
    
    // Get active users
    const activeUsers = await User.countDocuments({ isActive: true });
    const activeOrganizers = await Organizer.countDocuments({ isActive: true });
    const activeDoctors = await Doctor.countDocuments({ isActive: true });
    const activeVenueHosts = await VenueHost.countDocuments({ isActive: true });
    
    // Get recent events
    const upcomingEvents = await Event.find({ date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(5)
      .populate('organizer', 'companyName');
    
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');
      
    // Get trending venues (venues with most bookings or highest ratings)
    const trendingVenues = await Venue.find({ approvalStatus: 'approved' })
      .sort({ 'averageRating': -1 })
      .limit(5)
      .populate('venueHost', 'name venueName');
    
    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        counts: {
          users: userCount,
          organizers: organizerCount,
          doctors: doctorCount,
          events: eventCount,
          venueHosts: venueHostCount,
          venues: venueCount
        },
        active: {
          users: activeUsers,
          organizers: activeOrganizers,
          doctors: activeDoctors,
          venueHosts: activeVenueHosts
        },
        upcomingEvents,
        recentUsers,
        trendingVenues
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/users
 * @desc Get all users
 * @access Private (Admin only with manageUsers permission)
 */
router.get('/users', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageUsers']), 
  async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: error.message
      });
    }
});

/**
 * @route GET /api/admin/organizers
 * @desc Get all organizers
 * @access Private (Admin only with manageOrganizers permission)
 */
router.get('/organizers', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageOrganizers']), 
  async (req, res) => {
    try {
      const organizers = await Organizer.find().sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        message: 'Organizers retrieved successfully',
        data: {
          organizers
        }
      });
    } catch (error) {
      console.error('Get organizers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve organizers',
        error: error.message
      });
    }
});

/**
 * @route GET /api/admin/doctors
 * @desc Get all doctors
 * @access Private (Admin only with manageDoctors permission)
 */
router.get('/doctors', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageDoctors']), 
  async (req, res) => {
    try {
      const doctors = await Doctor.find().sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        message: 'Doctors retrieved successfully',
        data: {
          doctors
        }
      });
    } catch (error) {
      console.error('Get doctors error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve doctors',
        error: error.message
      });
    }
});

/**
 * @route GET /api/admin/events
 * @desc Get all events
 * @access Private (Admin only with manageEvents permission)
 */
router.get('/events', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageEvents']), 
  async (req, res) => {
    try {
      console.log('[ADMIN ROUTES] GET /events requested');
      
      const events = await Event.find()
        .sort({ createdAt: -1 })
        .populate('organizer', 'companyName email');
      
      console.log('[ADMIN ROUTES] Found', events.length, 'events');
      
      res.status(200).json({
        success: true,
        message: 'Events retrieved successfully',
        data: {
          events
        }
      });
    } catch (error) {
      console.error('[ADMIN ROUTES] Get events error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve events',
        error: error.message
      });
    }
});

/**
 * @route GET /api/admin/events/pending
 * @desc Get all pending events
 * @access Private (Admin only with manageEvents permission)
 */
router.get('/events/pending', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageEvents']), 
  async (req, res) => {
    try {
      console.log('[ADMIN ROUTES] GET /events/pending requested');
      console.log('[ADMIN ROUTES] User ID:', req.user._id);
      console.log('[ADMIN ROUTES] User Type:', req.userType);
      
      const pendingEvents = await Event.find({ approvalStatus: 'pending' })
        .sort({ createdAt: -1 })
        .populate('organizer', 'companyName email');
      
      console.log('[ADMIN ROUTES] Found', pendingEvents.length, 'pending events');
      
      res.status(200).json({
        success: true,
        message: 'Pending events retrieved successfully',
        data: {
          events: pendingEvents
        }
      });
    } catch (error) {
      console.error('[ADMIN ROUTES] Get pending events error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending events',
        error: error.message
      });
    }
});

/**
 * @route GET /api/admin/events/pending/:eventId
 * @desc Get detailed info for a pending event
 * @access Private (Admin only with manageEvents permission)
 */
router.get('/events/pending/:eventId', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageEvents']), 
  async (req, res) => {
    try {
      const { eventId } = req.params;
      
      const event = await Event.findOne({ 
        _id: eventId, 
        approvalStatus: 'pending' 
      }).populate('organizer', 'companyName email phone website');
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Pending event not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Event details retrieved successfully',
        data: {
          event
        }
      });
    } catch (error) {
      console.error('Get event details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve event details',
        error: error.message
      });
    }
});

/**
 * @route PUT /api/admin/events/:eventId/approve
 * @desc Approve an event (Admin only)
 * @access Private (Admin only with manageEvents permission)
 */
router.put('/events/:eventId/approve', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageEvents']), 
  async (req, res) => {
    try {
      const { eventId } = req.params;
      
      const event = await Event.findById(eventId).populate('organizer', 'companyName email');
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      
      if (event.approvalStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Event is already ${event.approvalStatus}`
        });
      }
      
      event.approvalStatus = 'approved';
      await event.save();
      
      // TODO: Send email notification to organizer about approval
      
      res.status(200).json({
        success: true,
        message: 'Event approved successfully',
        data: {
          event: {
            _id: event._id,
            title: event.title,
            approvalStatus: event.approvalStatus,
            organizer: {
              companyName: event.organizer.companyName,
              email: event.organizer.email
            }
          }
        }
      });
    } catch (error) {
      console.error('Approve event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve event',
        error: error.message
      });
    }
});

/**
 * @route PUT /api/admin/events/:eventId/reject
 * @desc Reject an event (Admin only)
 * @access Private (Admin only with manageEvents permission)
 */
router.put('/events/:eventId/reject', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageEvents']), 
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { rejectionReason } = req.body;
      
      if (!rejectionReason || rejectionReason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }
      
      const event = await Event.findById(eventId).populate('organizer', 'companyName email');
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      
      if (event.approvalStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Event is already ${event.approvalStatus}`
        });
      }
      
      event.approvalStatus = 'rejected';
      event.rejectionReason = rejectionReason;
      await event.save();
      
      // TODO: Send email notification to organizer about rejection with reason
      
      res.status(200).json({
        success: true,
        message: 'Event rejected successfully',
        data: {
          event: {
            _id: event._id,
            title: event.title,
            approvalStatus: event.approvalStatus,
            rejectionReason: event.rejectionReason,
            organizer: {
              companyName: event.organizer.companyName,
              email: event.organizer.email
            }
          }
        }
      });
    } catch (error) {
      console.error('Reject event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject event',
        error: error.message
      });
    }
});

/**
 * @route GET /api/admin/users/:userId
 * @desc Get detailed user information including tickets and hotel bookings
 * @access Private (Admin only with manageUsers permission)
 */
router.get('/users/:userId', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageUsers']), 
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user's event bookings
      const eventBookings = await Event.aggregate([
        { $match: { 'tickets.purchasedBy': userId } },
        { $unwind: '$tickets' },
        { $match: { 'tickets.purchasedBy': userId } },
        { $project: {
            _id: '$tickets._id',
            eventTitle: '$title',
            ticketType: '$tickets.type',
            purchaseDate: '$tickets.purchasedAt',
            status: '$tickets.status'
          }
        },
        { $sort: { purchaseDate: -1 } }
      ]);

      // Get user's hotel reservations (assuming there's a reservation collection)
      let hotelReservations = [];
      try {
        // If you have a hotel reservation model:
        const Reservation = require('../models/Reservation');
        hotelReservations = await Reservation.find({ userId })
          .sort({ createdAt: -1 })
          .select('hotelName checkInDate checkOutDate status')
          .lean();
      } catch (err) {
        console.log('Hotel reservations not available or model not found');
      }
      
      res.status(200).json({
        success: true,
        message: 'User details retrieved successfully',
        data: {
          user: {
            ...user.toObject(),
            bookings: {
              count: eventBookings.length,
              recent: eventBookings.slice(0, 5)
            },
            reservations: {
              count: hotelReservations.length,
              recent: hotelReservations.slice(0, 5)
            }
          }
        }
      });
    } catch (error) {
      console.error('Get user details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user details',
        error: error.message
      });
    }
});

/**
 * @route PATCH /api/admin/users/:userId/toggle-status
 * @desc Toggle user active status
 * @access Private (Admin only with manageUsers permission)
 */
router.patch('/users/:userId/toggle-status', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageUsers']), 
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      
      if (isActive === undefined) {
        return res.status(400).json({
          success: false,
          message: 'isActive field is required'
        });
      }
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      user.isActive = isActive;
      await user.save();
      
      res.status(200).json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            isActive: user.isActive
          }
        }
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: error.message
      });
    }
});

/**
 * @route GET /api/admin/organizers/:organizerId
 * @desc Get detailed organizer information including their events
 * @access Private (Admin only with manageOrganizers permission)
 */
router.get('/organizers/:organizerId', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageOrganizers']), 
  async (req, res) => {
    try {
      const { organizerId } = req.params;
      
      const organizer = await Organizer.findById(organizerId);
      
      if (!organizer) {
        return res.status(404).json({
          success: false,
          message: 'Organizer not found'
        });
      }

      // Get organizer's events
      const events = await Event.find({ organizer: organizerId })
        .sort({ createdAt: -1 })
        .select('title description date location ticketsSold approvalStatus')
        .lean();
      
      res.status(200).json({
        success: true,
        message: 'Organizer details retrieved successfully',
        data: {
          organizer: {
            ...organizer.toObject(),
            events: {
              count: events.length,
              recent: events.slice(0, 5)
            }
          }
        }
      });
    } catch (error) {
      console.error('Get organizer details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve organizer details',
        error: error.message
      });
    }
});

/**
 * @route PATCH /api/admin/organizers/:organizerId/toggle-status
 * @desc Toggle organizer active status
 * @access Private (Admin only with manageOrganizers permission)
 */
router.patch('/organizers/:organizerId/toggle-status', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageOrganizers']), 
  async (req, res) => {
    try {
      const { organizerId } = req.params;
      const { isActive } = req.body;
      
      if (isActive === undefined) {
        return res.status(400).json({
          success: false,
          message: 'isActive field is required'
        });
      }
      
      const organizer = await Organizer.findById(organizerId);
      
      if (!organizer) {
        return res.status(404).json({
          success: false,
          message: 'Organizer not found'
        });
      }
      
      organizer.isActive = isActive;
      await organizer.save();
      
      res.status(200).json({
        success: true,
        message: `Organizer ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          organizer: {
            _id: organizer._id,
            companyName: organizer.companyName,
            email: organizer.email,
            isActive: organizer.isActive
          }
        }
      });
    } catch (error) {
      console.error('Toggle organizer status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update organizer status',
        error: error.message
      });
    }
});

/**
 * @route GET /api/admin/doctors/:doctorId
 * @desc Get detailed doctor information including their bookings
 * @access Private (Admin only with manageDoctors permission)
 */
router.get('/doctors/:doctorId', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageDoctors']), 
  async (req, res) => {
    try {
      const { doctorId } = req.params;
      
      const doctor = await Doctor.findById(doctorId);
      
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      // Get doctor's appointments (assuming there's an Appointment model)
      let appointments = [];
      try {
        // If you have an appointments model:
        const Appointment = require('../models/Appointment');
        appointments = await Appointment.find({ doctorId })
          .sort({ appointmentDate: -1 })
          .select('patientName appointmentDate status reason')
          .populate('userId', 'name email')
          .lean();
      } catch (err) {
        console.log('Appointments not available or model not found');
      }
      
      res.status(200).json({
        success: true,
        message: 'Doctor details retrieved successfully',
        data: {
          doctor: {
            ...doctor.toObject(),
            appointments: {
              count: appointments.length,
              recent: appointments.slice(0, 5)
            }
          }
        }
      });
    } catch (error) {
      console.error('Get doctor details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve doctor details',
        error: error.message
      });
    }
});

/**
 * @route PATCH /api/admin/doctors/:doctorId/toggle-status
 * @desc Toggle doctor active status
 * @access Private (Admin only with manageDoctors permission)
 */
router.patch('/doctors/:doctorId/toggle-status', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageDoctors']), 
  async (req, res) => {
    try {
      const { doctorId } = req.params;
      const { isActive } = req.body;
      
      if (isActive === undefined) {
        return res.status(400).json({
          success: false,
          message: 'isActive field is required'
        });
      }
      
      const doctor = await Doctor.findById(doctorId);
      
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }
      
      doctor.isActive = isActive;
      await doctor.save();
      
      res.status(200).json({
        success: true,
        message: `Doctor ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          doctor: {
            _id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            isActive: doctor.isActive
          }
        }
      });
    } catch (error) {
      console.error('Toggle doctor status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update doctor status',
        error: error.message
      });
    }
});

/**
 * @route GET /api/admin/accounts
 * @desc Get all admin accounts (Admin only with manageAdmins permission)
 * @access Private
 */
router.get('/accounts', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageAdmins']), 
  async (req, res) => {
    try {
      const admins = await Admin.find()
        .select('-updatedAt')
        .sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        message: 'Admin accounts retrieved successfully',
        data: {
          admins
        }
      });
    } catch (error) {
      console.error('Get admin accounts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve admin accounts',
        error: error.message
      });
    }
});

/**
 * @route POST /api/admin/accounts
 * @desc Create a new admin account (Admin only with manageAdmins permission)
 * @access Private
 */
router.post('/accounts', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageAdmins']), 
  async (req, res) => {
    try {
      const { name, email, phone, password, role, permissions } = req.body;
      
      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required'
        });
      }

      // Check if email already exists
      const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'An admin with that email already exists'
        });
      }

      // Validate role
      const validRoles = ['superadmin', 'manager', 'support', 'content'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create admin account
      const newAdmin = new Admin({
        name,
        email: email.toLowerCase(),
        phone,
        role: role || 'manager',
        permissions,
        password: hashedPassword,
        isActive: true
      });

      await newAdmin.save();
      
      res.status(201).json({
        success: true,
        message: 'Admin account created successfully',
        data: {
          admin: {
            _id: newAdmin._id,
            name: newAdmin.name,
            email: newAdmin.email,
            role: newAdmin.role
          }
        }
      });
    } catch (error) {
      console.error('Create admin account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create admin account',
        error: error.message
      });
    }
});

/**
 * @route PATCH /api/admin/accounts/:adminId/toggle-status
 * @desc Toggle admin account status (Admin only with manageAdmins permission)
 * @access Private
 */
router.patch('/accounts/:adminId/toggle-status', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageAdmins']), 
  async (req, res) => {
    try {
      const { adminId } = req.params;
      const { isActive } = req.body;
      
      if (isActive === undefined) {
        return res.status(400).json({
          success: false,
          message: 'isActive field is required'
        });
      }
      
      // Don't allow deactivating yourself
      if (adminId === req.user._id.toString() && !isActive) {
        return res.status(400).json({
          success: false,
          message: 'You cannot deactivate your own account'
        });
      }

      const admin = await Admin.findById(adminId);
      
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }
      
      admin.isActive = isActive;
      await admin.save();
      
      res.status(200).json({
        success: true,
        message: `Admin account ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            isActive: admin.isActive
          }
        }
      });
    } catch (error) {
      console.error('Toggle admin status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update admin status',
        error: error.message
      });
    }
});

/**
 * @route GET /api/admin/accounts/all
 * @desc Get all admin accounts (without permission check - for development)
 * @access Private (Admin only)
 */
router.get('/accounts/all', 
  authenticate, 
  authorizeUserType(['admin']), 
  async (req, res) => {
    try {
      const admins = await Admin.find()
        .select('-password -updatedAt')
        .sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        message: 'Admin accounts retrieved successfully',
        data: {
          admins
        }
      });
    } catch (error) {
      console.error('Get admin accounts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve admin accounts',
        error: error.message
      });
    }
});

/**
 * @route POST /api/admin/seed-admin
 * @desc Create a seed admin account if no admins exist yet
 * @access Public (only works if no admins exist)
 */
router.post('/seed-admin', async (req, res) => {
  try {
    // Check if there are any admins in the database
    const adminCount = await Admin.countDocuments();
    
    if (adminCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin accounts already exist. This endpoint is only available for initial setup.'
      });
    }
    
    // Create default admin with superadmin role and all permissions
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const seedAdmin = new Admin({
      name: 'System Administrator',
      email: 'admin@eventuraa.lk',
      password: hashedPassword,
      role: 'superadmin',
      permissions: {
        manageUsers: true,
        manageOrganizers: true,
        manageDoctors: true,
        manageEvents: true,
        manageContent: true,
        manageAdmins: true,
        viewReports: true,
        financialAccess: true
      }
    });
    
    await seedAdmin.save();
    
    res.status(201).json({
      success: true,
      message: 'Seed admin account created successfully',
      data: {
        admin: {
          email: seedAdmin.email,
          password: 'admin123' // Only show password in response for initial setup
        }
      }
    });
  } catch (error) {
    console.error('Seed admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create seed admin account',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/venues
 * @desc Get all venues
 * @access Private (Admin only with manageVenues permission)
 */
router.get('/venues', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageVenues']), 
  async (req, res) => {
    try {
      console.log('[ADMIN ROUTES] GET /venues requested');
      
      const venues = await Venue.find()
        .sort({ createdAt: -1 })
        .populate('venueHost', 'name email companyName');
      
      res.status(200).json({
        success: true,
        message: 'Venues retrieved successfully',
        data: {
          venues
        }
      });
    } catch (error) {
      console.error('Get venues error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve venues',
        error: error.message
      });
    }
});

/**
 * @route GET /api/admin/venues/pending
 * @desc Get all pending venues
 * @access Private (Admin only with manageVenues permission)
 */
router.get('/venues/pending',
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageVenues']), 
  async (req, res) => {
    try {
      console.log('[ADMIN ROUTES] GET /venues/pending requested');
      
      const pendingVenues = await Venue.find({ approvalStatus: 'pending' })
        .sort({ createdAt: -1 })
        .populate('venueHost', 'name email');
      
      console.log('[ADMIN ROUTES] Found', pendingVenues.length, 'pending venues');
      
      res.status(200).json({
        success: true,
        message: 'Pending venues retrieved successfully',
        data: {
          venues: pendingVenues
        }
      });
    } catch (error) {
      console.error('[ADMIN ROUTES] Get pending venues error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending venues',
        error: error.message
      });
    }
});

/**
 * @route PUT /api/admin/venues/:venueId/approve
 * @desc Approve a venue (Admin only)
 * @access Private (Admin only with manageVenues permission)
 */
router.put('/venues/:venueId/approve',
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageVenues']), 
  async (req, res) => {
    try {
      const { venueId } = req.params;
      
      // Check if venue exists
      const venue = await Venue.findById(venueId);
      
      if (!venue) {
        return res.status(404).json({
          success: false,
          message: 'Venue not found'
        });
      }
      
      // Check if venue is already approved or rejected
      if (venue.approvalStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Venue is already ${venue.approvalStatus}`
        });
      }
      
      // Approve venue
      venue.approvalStatus = 'approved';
      await venue.save();
      
      res.status(200).json({
        success: true,
        message: 'Venue approved successfully',
        data: {
          venue
        }
      });
    } catch (error) {
      console.error('Approve venue error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve venue',
        error: error.message
      });
    }
});

/**
 * @route PUT /api/admin/venues/:venueId/reject
 * @desc Reject a venue (Admin only)
 * @access Private (Admin only with manageVenues permission)
 */
router.put('/venues/:venueId/reject',
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageVenues']), 
  async (req, res) => {
    try {
      const { venueId } = req.params;
      const { rejectionReason } = req.body;
      
      if (!rejectionReason || rejectionReason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }
      
      // Check if venue exists
      const venue = await Venue.findById(venueId);
      
      if (!venue) {
        return res.status(404).json({
          success: false,
          message: 'Venue not found'
        });
      }
      
      // Check if venue is already approved or rejected
      if (venue.approvalStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Venue is already ${venue.approvalStatus}`
        });
      }
      
      // Reject venue
      venue.approvalStatus = 'rejected';
      venue.rejectionReason = rejectionReason;
      await venue.save();
      
      // TODO: Send email notification to venue host about rejection with reason
      
      res.status(200).json({
        success: true,
        message: 'Venue rejected successfully',
        data: {
          venue: {
            _id: venue._id,
            name: venue.name,
            rejectionReason: venue.rejectionReason,
            approvalStatus: venue.approvalStatus
          }
        }
      });
    } catch (error) {
      console.error('Reject venue error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject venue',
        error: error.message
      });
    }
});

/**
 * @route GET /api/admin/venue-hosts
 * @desc Get all venue hosts
 * @access Private (Admin only with manageVenueHosts permission)
 */
router.get('/venue-hosts', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageVenueHosts']), 
  async (req, res) => {
    try {
      console.log('[ADMIN ROUTES] GET /venue-hosts requested');
      
      const venueHosts = await VenueHost.find().sort({ createdAt: -1 });
      
      // For each venue host, count how many venues they have
      const venueHostsWithVenueCount = await Promise.all(
        venueHosts.map(async (host) => {
          const venueCount = await Venue.countDocuments({ venueHost: host._id });
          return {
            ...host.toObject(),
            totalVenues: venueCount
          };
        })
      );
      
      res.status(200).json({
        success: true,
        message: 'Venue hosts retrieved successfully',
        data: {
          venueHosts: venueHostsWithVenueCount
        }
      });
    } catch (error) {
      console.error('Get venue hosts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve venue hosts',
        error: error.message
      });
    }
});

/**
 * @route PUT /api/admin/venue-hosts/:hostId/activate
 * @desc Activate a venue host
 * @access Private (Admin only with manageVenueHosts permission)
 */
router.put('/venue-hosts/:hostId/activate',
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageVenueHosts']), 
  async (req, res) => {
    try {
      const { hostId } = req.params;
      
      const host = await VenueHost.findById(hostId);
      
      if (!host) {
        return res.status(404).json({
          success: false,
          message: 'Venue host not found'
        });
      }
      
      if (host.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Venue host is already active'
        });
      }
      
      host.isActive = true;
      await host.save();
      
      res.status(200).json({
        success: true,
        message: 'Venue host activated successfully',
        data: {
          host: {
            _id: host._id,
            name: host.name,
            isActive: host.isActive
          }
        }
      });
    } catch (error) {
      console.error('Activate venue host error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate venue host',
        error: error.message
      });
    }
});

/**
 * @route PUT /api/admin/venue-hosts/:hostId/deactivate
 * @desc Deactivate a venue host
 * @access Private (Admin only with manageVenueHosts permission)
 */
router.put('/venue-hosts/:hostId/deactivate',
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageVenueHosts']), 
  async (req, res) => {
    try {
      const { hostId } = req.params;
      
      const host = await VenueHost.findById(hostId);
      
      if (!host) {
        return res.status(404).json({
          success: false,
          message: 'Venue host not found'
        });
      }
      
      if (!host.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Venue host is already inactive'
        });
      }
      
      host.isActive = false;
      await host.save();
      
      res.status(200).json({
        success: true,
        message: 'Venue host deactivated successfully',
        data: {
          host: {
            _id: host._id,
            name: host.name,
            isActive: host.isActive
          }
        }
      });
    } catch (error) {
      console.error('Deactivate venue host error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate venue host',
        error: error.message
      });
    }
});

/**
 * @route GET /api/admin/venue-hosts/:hostId
 * @desc Get detailed venue host information
 * @access Private (Admin only with manageVenueHosts permission)
 */
router.get('/venue-hosts/:hostId', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageVenueHosts']), 
  async (req, res) => {
    try {
      const { hostId } = req.params;
      
      const venueHost = await VenueHost.findById(hostId);
      
      if (!venueHost) {
        return res.status(404).json({
          success: false,
          message: 'Venue host not found'
        });
      }

      // Get venue host's venues
      const venues = await Venue.find({ venueHost: hostId })
        .sort({ createdAt: -1 })
        .select('name type location priceRange images approvalStatus isActive createdAt')
        .lean();
      
      res.status(200).json({
        success: true,
        message: 'Venue host details retrieved successfully',
        data: {
          venueHost: {
            ...venueHost.toObject(),
            venues: {
              count: venues.length,
              items: venues
            }
          }
        }
      });
    } catch (error) {
      console.error('Get venue host details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve venue host details',
        error: error.message
      });
    }
});

/**
 * @route GET /api/admin/venues/:venueId
 * @desc Get detailed venue information
 * @access Private (Admin only with manageVenues permission)
 */
router.get('/venues/:venueId', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageVenues']), 
  async (req, res) => {
    try {
      const { venueId } = req.params;
      
      const venue = await Venue.findById(venueId)
        .populate('venueHost', 'name email companyName phone');
      
      if (!venue) {
        return res.status(404).json({
          success: false,
          message: 'Venue not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Venue details retrieved successfully',
        data: {
          venue
        }
      });
    } catch (error) {
      console.error('Get venue details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve venue details',
        error: error.message
      });
    }
});

/**
 * @route PUT /api/admin/doctors/:doctorId/verify
 * @desc Verify a doctor
 * @access Private (Admin only with manageDoctors permission)
 */
router.put('/doctors/:doctorId/verify',
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageDoctors']), 
  async (req, res) => {
    try {
      const { doctorId } = req.params;
      
      const doctor = await Doctor.findById(doctorId);
      
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }
      
      if (doctor.verificationStatus.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Doctor is already verified'
        });
      }
      
      doctor.verificationStatus.isVerified = true;
      doctor.verificationStatus.verificationDate = new Date();
      await doctor.save();
      
      res.status(200).json({
        success: true,
        message: 'Doctor verified successfully',
        data: {
          doctor: {
            _id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            verificationStatus: doctor.verificationStatus
          }
        }
      });
    } catch (error) {
      console.error('Verify doctor error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify doctor',
        error: error.message
      });
    }
});

/**
 * @route PUT /api/admin/doctors/:doctorId/unverify
 * @desc Unverify a doctor
 * @access Private (Admin only with manageDoctors permission)
 */
router.put('/doctors/:doctorId/unverify',
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageDoctors']), 
  async (req, res) => {
    try {
      const { doctorId } = req.params;
      
      const doctor = await Doctor.findById(doctorId);
      
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }
      
      if (!doctor.verificationStatus.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Doctor is already unverified'
        });
      }
      
      doctor.verificationStatus.isVerified = false;
      doctor.verificationStatus.verificationDate = undefined;
      await doctor.save();
      
      res.status(200).json({
        success: true,
        message: 'Doctor verification revoked successfully',
        data: {
          doctor: {
            _id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            verificationStatus: doctor.verificationStatus
          }
        }
      });
    } catch (error) {
      console.error('Unverify doctor error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to revoke doctor verification',
        error: error.message
      });
    }
});

/**
 * @route PUT /api/admin/organizers/:organizerId/verify
 * @desc Verify an organizer
 * @access Private (Admin only with manageOrganizers permission)
 */
router.put('/organizers/:organizerId/verify',
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageOrganizers']), 
  async (req, res) => {
    try {
      const { organizerId } = req.params;
      
      const organizer = await Organizer.findById(organizerId);
      
      if (!organizer) {
        return res.status(404).json({
          success: false,
          message: 'Organizer not found'
        });
      }
      
      if (organizer.verificationStatus.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Organizer is already verified'
        });
      }
      
      organizer.verificationStatus.isVerified = true;
      organizer.verificationStatus.verificationDate = new Date();
      await organizer.save();
      
      res.status(200).json({
        success: true,
        message: 'Organizer verified successfully',
        data: {
          organizer: {
            _id: organizer._id,
            name: organizer.name,
            companyName: organizer.companyName,
            email: organizer.email,
            verificationStatus: organizer.verificationStatus
          }
        }
      });
    } catch (error) {
      console.error('Verify organizer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify organizer',
        error: error.message
      });
    }
});

/**
 * @route PUT /api/admin/organizers/:organizerId/unverify
 * @desc Unverify an organizer
 * @access Private (Admin only with manageOrganizers permission)
 */
router.put('/organizers/:organizerId/unverify',
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageOrganizers']), 
  async (req, res) => {
    try {
      const { organizerId } = req.params;
      
      const organizer = await Organizer.findById(organizerId);
      
      if (!organizer) {
        return res.status(404).json({
          success: false,
          message: 'Organizer not found'
        });
      }
      
      if (!organizer.verificationStatus.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Organizer is already unverified'
        });
      }
      
      organizer.verificationStatus.isVerified = false;
      organizer.verificationStatus.verificationDate = undefined;
      await organizer.save();
      
      res.status(200).json({
        success: true,
        message: 'Organizer verification revoked successfully',
        data: {
          organizer: {
            _id: organizer._id,
            name: organizer.name,
            companyName: organizer.companyName,
            email: organizer.email,
            verificationStatus: organizer.verificationStatus
          }
        }
      });
    } catch (error) {
      console.error('Unverify organizer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to revoke organizer verification',
        error: error.message
      });
    }
});

module.exports = router; 