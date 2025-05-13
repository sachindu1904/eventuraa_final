const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const Venue = require('../models/Venue');
const { authenticate, authorizeUserType } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
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
      totalPrice
    } = req.body;

    // Validate required fields
    if (!venue || !roomType || !checkInDate || !checkOutDate || !guests || !contactInfo || !totalPrice) {
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
      status: { $nin: ['cancelled'] },
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
      // Add user ID if authenticated
      user: req.user ? req.user._id : null
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
          totalPrice: newBooking.totalPrice
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
 * @route   GET /api/bookings/:id
 * @desc    Get booking details by ID
 * @access  Private (only the booking's user or admin)
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('venue', 'name location address images')
      .populate('roomType', 'name capacity pricePerNight images')
      .populate('room', 'roomNumber');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Ensure the user can access this booking
    if (
      booking.user && 
      booking.user.toString() !== req.user._id.toString() &&
      req.user.userType !== 'admin' &&
      req.user.userType !== 'venue-host'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }
    
    // For venue hosts, ensure they can only see bookings for their venues
    if (req.user.userType === 'venue-host') {
      const venue = await Venue.findOne({ 
        _id: booking.venue, 
        venueHost: req.user._id 
      });
      
      if (!venue) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this booking'
        });
      }
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
 * @route   PUT /api/bookings/:id/cancel
 * @desc    Cancel a booking
 * @access  Private (only the booking's user or admin)
 */
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Ensure the user can cancel this booking
    if (
      booking.user && 
      booking.user.toString() !== req.user._id.toString() &&
      req.user.userType !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }
    
    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }
    
    // Check if booking is already completed
    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking'
      });
    }
    
    // Update booking status
    booking.status = 'cancelled';
    await booking.save();
    
    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking: {
          _id: booking._id,
          status: booking.status
        }
      }
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
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

module.exports = router; 