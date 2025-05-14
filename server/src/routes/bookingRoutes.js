const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const Venue = require('../models/Venue');
const User = require('../models/User');
const { authenticate, authorizeUserType } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking with payment
 * @access  Public (registered and non-registered users)
 */
router.post('/', async (req, res) => {
  try {
    const {
      venue,
      roomType,
      checkInDate,
      checkOutDate,
      guests,
      contactInfo,
      specialRequests,
      totalPrice,
      payment
    } = req.body;

    // Validate required fields
    if (!venue || !roomType || !checkInDate || !checkOutDate || !guests || !contactInfo || !totalPrice || !payment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking information'
      });
    }

    // Validate contact info
    if (!contactInfo.firstName || !contactInfo.lastName || !contactInfo.email || !contactInfo.phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required contact information'
      });
    }

    // Validate payment info
    if (!payment.method) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment method'
      });
    }

    // Parse dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    // Validate dates
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }
    
    // Check if room type exists and belongs to the venue
    const roomTypeData = await RoomType.findOne({ _id: roomType, venue: venue });
    if (!roomTypeData) {
      return res.status(404).json({
        success: false,
        message: 'Room type not found for this venue'
      });
    }

    // Get venue host ID
    const venueData = await Venue.findById(venue);
    if (!venueData) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    // Check if the requested number of guests is within room capacity
    if (guests > roomTypeData.capacity) {
      return res.status(400).json({
        success: false,
        message: `This room type can only accommodate ${roomTypeData.capacity} guests`
      });
    }

    // Find an available room of this type for the requested dates
    // Find rooms that are not booked during the requested period
    const existingBookings = await Booking.find({
      roomType: roomType,
      status: { $nin: ['cancelled', 'rejected'] },
      $or: [
        // Check-in date falls within an existing booking
        { checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }
      ]
    }).select('room');
    
    // Get IDs of rooms already booked during this period
    const bookedRoomIds = existingBookings.map(booking => booking.room);
    
    // Find available rooms of this type
    const availableRooms = await Room.find({
      roomType: roomType,
      status: 'available',
      _id: { $nin: bookedRoomIds }
    }).limit(1);
    
    if (availableRooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No available rooms for the selected dates'
      });
    }
    
    // Get a room for this booking
    const roomForBooking = availableRooms[0];

    // Process payment (mock implementation)
    // In a real app, you would integrate with a payment gateway here
    const paymentResult = await processPayment(payment, totalPrice);
    
    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment processing failed',
        error: paymentResult.error
      });
    }

    // Create a new booking
    const newBooking = new Booking({
      venue,
      roomType,
      room: roomForBooking._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guests,
      contactInfo,
      specialRequests: specialRequests || '',
      totalPrice,
      payment: {
        method: payment.method,
        status: 'paid',
        transactionId: paymentResult.transactionId,
        cardLastFour: payment.cardLastFour || null
      },
      // Add user ID if authenticated
      user: req.user ? req.user._id : null,
      venueHost: venueData.venueHost
    });

    // Save the booking
    await newBooking.save();
    
    // Success response with booking reference
    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: {
          _id: newBooking._id,
          bookingReference: newBooking.bookingReference,
          checkInDate: newBooking.checkInDate,
          checkOutDate: newBooking.checkOutDate,
          status: newBooking.status,
          totalPrice: newBooking.totalPrice,
          payment: {
            status: newBooking.payment.status,
            method: newBooking.payment.method
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Mock function for payment processing
// In a real implementation, this would integrate with a payment gateway
async function processPayment(paymentDetails, amount) {
  try {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate a mock transaction ID
    const transactionId = 'tr_' + Math.random().toString(36).substring(2, 15);
    
    return {
      success: true,
      transactionId,
      message: 'Payment processed successfully'
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: 'Payment processing failed'
    };
  }
}

// Mock function for refund processing
async function processRefund(transactionId, amount) {
  try {
    // Simulate refund processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate a mock refund ID
    const refundId = 'rf_' + Math.random().toString(36).substring(2, 15);
    
    return {
      success: true,
      refundId,
      message: 'Refund processed successfully'
    };
  } catch (error) {
    console.error('Refund processing error:', error);
    return {
      success: false,
      error: 'Refund processing failed'
    };
  }
}

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings for the authenticated user
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('venue', 'name location')
      .populate('roomType', 'name')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      data: {
        bookings
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/bookings/host-bookings
 * @desc    Get all bookings for venues owned by the authenticated venue host
 * @access  Private (venue-host only)
 */
router.get('/host-bookings', authenticate, authorizeUserType(['venue-host']), async (req, res) => {
  try {
    // Find all venues owned by this host
    const venues = await Venue.find({ venueHost: req.user._id }).select('_id');
    const venueIds = venues.map(venue => venue._id);
    
    // Find all bookings for these venues
    const bookings = await Booking.find({ venue: { $in: venueIds } })
      .populate('venue', 'name location')
      .populate('roomType', 'name pricePerNight')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      data: {
        bookings
      }
    });
  } catch (error) {
    console.error('Error fetching host bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/bookings/host-customers
 * @desc    Get all customers who have booked venues owned by the authenticated venue host
 * @access  Private (venue-host only)
 */
router.get('/host-customers', authenticate, authorizeUserType(['venue-host']), async (req, res) => {
  try {
    // Find all venues owned by this host
    const venues = await Venue.find({ venueHost: req.user._id }).select('_id');
    const venueIds = venues.map(venue => venue._id);
    
    // Find all bookings for these venues
    const bookings = await Booking.find({ 
      venue: { $in: venueIds },
      status: { $in: ['confirmed', 'completed'] }
    });
    
    // Extract unique customer information
    const customers = [];
    const customerEmails = new Set();
    
    for (const booking of bookings) {
      if (!customerEmails.has(booking.contactInfo.email)) {
        customerEmails.add(booking.contactInfo.email);
        
        // Check if this customer is a registered user
        let user = null;
        if (booking.user) {
          user = await User.findById(booking.user).select('_id firstName lastName email profileImage');
        }
        
        customers.push({
          email: booking.contactInfo.email,
          firstName: booking.contactInfo.firstName,
          lastName: booking.contactInfo.lastName,
          phone: booking.contactInfo.phone,
          user: user,
          bookingsCount: 1,
          lastBooking: booking.createdAt
        });
      } else {
        // Update existing customer
        const existingCustomer = customers.find(c => c.email === booking.contactInfo.email);
        existingCustomer.bookingsCount++;
        
        if (new Date(booking.createdAt) > new Date(existingCustomer.lastBooking)) {
          existingCustomer.lastBooking = booking.createdAt;
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        customers: customers.sort((a, b) => new Date(b.lastBooking) - new Date(a.lastBooking))
      }
    });
  } catch (error) {
    console.error('Error fetching host customers:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking details by ID
 * @access  Private (only the booking's user or admin)
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('venue', 'name location address images')
      .populate('roomType', 'name capacity pricePerNight images')
      .populate('room', 'roomNumber')
      .populate('user', 'firstName lastName email');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Ensure the user can access this booking
    if (
      booking.user && 
      booking.user._id.toString() !== req.user._id.toString() &&
      req.user.userType !== 'admin' &&
      booking.venueHost.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        booking
      }
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/bookings/:id/status
 * @desc    Update booking status (confirm, reject, cancel, complete)
 * @access  Private (venue host for confirm/reject, user for cancel, admin for any)
 */
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check authorization based on requested status change
    if (status === 'confirmed' || status === 'rejected') {
      // Only venue host or admin can confirm or reject
      if (req.user.userType !== 'admin' && booking.venueHost.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this booking status'
        });
      }
    } else if (status === 'cancelled') {
      // User, venue host, or admin can cancel
      if (
        req.user.userType !== 'admin' && 
        booking.venueHost.toString() !== req.user._id.toString() &&
        (booking.user && booking.user.toString() !== req.user._id.toString())
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this booking'
        });
      }
    } else if (status === 'completed') {
      // Only venue host or admin can mark as completed
      if (req.user.userType !== 'admin' && booking.venueHost.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to complete this booking'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    // Handle status-specific actions
    if (status === 'rejected') {
      // Process refund if payment was made
      if (booking.payment.status === 'paid') {
        const refundResult = await processRefund(booking.payment.transactionId, booking.totalPrice);
        
        if (refundResult.success) {
          booking.payment.status = 'refunded';
          booking.payment.refundId = refundResult.refundId;
          booking.payment.refundDate = new Date();
          booking.payment.refundReason = rejectionReason;
        } else {
          return res.status(500).json({
            success: false,
            message: 'Failed to process refund',
            error: refundResult.error
          });
        }
      }
      
      booking.rejectionReason = rejectionReason;
    } else if (status === 'cancelled' && booking.payment.status === 'paid') {
      // Process refund for cancellation if payment was made
      const refundResult = await processRefund(booking.payment.transactionId, booking.totalPrice);
        
      if (refundResult.success) {
        booking.payment.status = 'refunded';
        booking.payment.refundId = refundResult.refundId;
        booking.payment.refundDate = new Date();
        booking.payment.refundReason = 'Booking cancelled';
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to process refund',
          error: refundResult.error
        });
      }
    }
    
    // Update booking status
    booking.status = status;
    await booking.save();
    
    return res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: {
        booking: {
          _id: booking._id,
          status: booking.status,
          payment: booking.payment
        }
      }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/bookings/venue/:venueId
 * @desc    Get all bookings for a specific venue
 * @access  Private (venue-host only)
 */
router.get('/venue/:venueId', authenticate, authorizeUserType(['venue-host', 'admin']), async (req, res) => {
  try {
    const { venueId } = req.params;
    
    // For venue hosts, ensure they can only see bookings for their venues
    if (req.user.userType === 'venue-host') {
      const venue = await Venue.findOne({ 
        _id: venueId, 
        venueHost: req.user._id 
      });
      
      if (!venue) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view bookings for this venue'
        });
      }
    }
    
    const bookings = await Booking.find({ venue: venueId })
      .populate('roomType', 'name')
      .populate('room', 'roomNumber')
      .populate('user', 'firstName lastName email')
      .sort({ checkInDate: 1 });
    
    return res.status(200).json({
      success: true,
      data: {
        bookings
      }
    });
  } catch (error) {
    console.error('Error fetching venue bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/bookings
 * @desc    Get all bookings (admin only)
 * @access  Private (admin only)
 */
router.get('/admin/bookings', authenticate, authorizeUserType(['admin']), async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('venue', 'name location')
      .populate('roomType', 'name')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      data: {
        bookings
      }
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router; 