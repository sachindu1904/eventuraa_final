const express = require('express');
const router = express.Router();
const { authenticate, authorizeUserType, authorizeAdminPermission } = require('../middleware/authMiddleware');
const Event = require('../models/Event');

/**
 * @route GET /api/events
 * @desc Get all approved events
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    // Only return approved events
    const events = await Event.find({ 
      approvalStatus: 'approved',
      isActive: true
    })
    .sort({ date: 1 })
    .populate('organizer', 'companyName');
    
    res.status(200).json({
      success: true,
      message: 'Events retrieved successfully',
      data: {
        events
      }
    });
  } catch (error) {
    console.error('Get public events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve events',
      error: error.message
    });
  }
});

/**
 * @route GET /api/events/admin/pending
 * @desc Get all pending events (Admin only)
 * @access Private (Admin only with manageEvents permission)
 */
router.get('/admin/pending', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageEvents']), 
  async (req, res) => {
    try {
      console.log('[EVENTS ROUTES] GET /admin/pending requested');
      console.log('[EVENTS ROUTES] User ID:', req.user._id);
      
      const pendingEvents = await Event.find({ approvalStatus: 'pending' })
        .sort({ createdAt: -1 })
        .populate('organizer', 'companyName email');
      
      console.log('[EVENTS ROUTES] Found', pendingEvents.length, 'pending events');
      
      res.status(200).json({
        success: true,
        message: 'Pending events retrieved successfully',
        data: {
          events: pendingEvents
        }
      });
    } catch (error) {
      console.error('[EVENTS ROUTES] Get pending events error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending events',
        error: error.message
      });
    }
});

/**
 * @route PUT /api/events/admin/:eventId/approve
 * @desc Approve an event (Admin only)
 * @access Private (Admin only with manageEvents permission)
 */
router.put('/admin/:eventId/approve', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageEvents']), 
  async (req, res) => {
    try {
      const { eventId } = req.params;
      
      const event = await Event.findById(eventId);
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      
      event.approvalStatus = 'approved';
      await event.save();
      
      res.status(200).json({
        success: true,
        message: 'Event approved successfully',
        data: {
          event
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
 * @route PUT /api/events/admin/:eventId/reject
 * @desc Reject an event (Admin only)
 * @access Private (Admin only with manageEvents permission)
 */
router.put('/admin/:eventId/reject', 
  authenticate, 
  authorizeUserType(['admin']), 
  authorizeAdminPermission(['manageEvents']), 
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { rejectionReason } = req.body;
      
      const event = await Event.findById(eventId);
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      
      event.approvalStatus = 'rejected';
      event.rejectionReason = rejectionReason;
      await event.save();
      
      res.status(200).json({
        success: true,
        message: 'Event rejected successfully',
        data: {
          event
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
 * @route GET /api/events/:eventId
 * @desc Get a specific event
 * @access Public
 */
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findOne({ 
      _id: eventId,
      approvalStatus: 'approved',
      isActive: true
    }).populate('organizer', 'companyName');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Event retrieved successfully',
      data: {
        event
      }
    });
  } catch (error) {
    console.error('Get public event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve event',
      error: error.message
    });
  }
});

module.exports = router; 