const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const { venueHostAuth } = require('../middleware/venueHostAuth');
const Booking = require('../models/Booking');
const RoomType = require('../models/RoomType');
const Venue = require('../models/Venue');
const User = require('../models/User');

// Create a new booking
router.post('/', auth, async (req, res) => {
  try {
    const {
      venue,
      roomType,
      checkInDate,
      checkOutDate,
      guests,
      specialRequests,
      contactInfo,
      payment,
      totalPrice,
      serviceFee,
      nightCount
    } = req.body;

    // Validate required fields
    if (!venue || !roomType || !checkInDate || !checkOutDate || !guests || !contactInfo || !payment) {
      return res.status(400).json({ success: false, message: 'Missing required booking information' });
    }

    // Check if the venue and room type exist
    const venueExists = await Venue.exists({ _id: venue });
    if (!venueExists) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    const roomTypeExists = await RoomType.findOne({ _id: roomType });
    if (!roomTypeExists) {
      return res.status(404).json({ success: false, message: 'Room type not found' });
    }

    // Check if the room has enough capacity for the guests
    if (guests > roomTypeExists.capacity) {
      return res.status(400).json({ 
        success: false, 
        message: `This room can only accommodate up to ${roomTypeExists.capacity} guests` 
      });
    }

    // Check if the room is available for the requested dates
    const isAvailable = await Booking.isRoomTypeAvailable(roomType, checkInDate, checkOutDate);
    if (!isAvailable) {
      return res.status(400).json({ 
        success: false, 
        message: 'This room is not available for the selected dates. Please choose different dates or another room.' 
      });
    }

    // Create the new booking
    const booking = new Booking({
      venue,
      roomType,
      user: req.user.id,
      checkInDate,
      checkOutDate,
      nightCount,
      guests,
      specialRequests,
      contactInfo,
      payment,
      totalPrice,
      serviceFee,
      status: 'pending'
    });

    await booking.save();

    // Update room type availability (reduce available rooms)
    await RoomType.findByIdAndUpdate(roomType, {
      $inc: { availableRooms: -1 }
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      _id: booking._id,
      bookingId: booking._id,
      bookingReference: booking.bookingReference
    });
  } catch (error) {
    console.error('Error creating booking:', error);

    if (error.name === 'AvailabilityError') {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

// Get booking by ID (for all users - requires authorization checks)
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('venue', 'name images address')
      .populate('roomType', 'name pricePerNight');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Security check: only allow the booking user, venue host, or admin to view the booking
    const isBookingUser = booking.user.toString() === req.user.id;
    
    // Check if the user is the venue host for this booking
    const venue = await Venue.findById(booking.venue);
    const isVenueHost = venue && venue.venueHost.toString() === req.user.id;

    // Check if the user is an admin
    const user = await User.findById(req.user.id);
    const isAdmin = user && user.userType === 'admin';

    if (!isBookingUser && !isVenueHost && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this booking' });
    }

    res.json({
      success: true,
      data: {
        booking
      }
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking details' });
  }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('venue', 'name images address')
      .populate('roomType', 'name pricePerNight')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        bookings
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// Get venue host's bookings
router.get('/host-bookings', venueHostAuth, async (req, res) => {
  try {
    // Get all venues owned by this host
    const hostVenues = await Venue.find({ venueHost: req.user.id }).select('_id');
    
    // Extract venue IDs
    const venueIds = hostVenues.map(venue => venue._id);
    
    // Query parameter for a specific venue
    const { venueId } = req.query;
    const query = venueId 
      ? { venue: venueId } 
      : { venue: { $in: venueIds } };

    const bookings = await Booking.find(query)
      .populate('venue', 'name images address')
      .populate('roomType', 'name pricePerNight')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        bookings
      }
    });
  } catch (error) {
    console.error('Error fetching host bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// Change booking status (confirm, cancel, complete)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Security check: only allow the booking user, venue host, or admin to update the booking
    const isBookingUser = booking.user.toString() === req.user.id;
    
    // Check if the user is the venue host for this booking
    const venue = await Venue.findById(booking.venue);
    const isVenueHost = venue && venue.venueHost.toString() === req.user.id;
    
    // Check if the user is an admin
    const user = await User.findById(req.user.id);
    const isAdmin = user && user.userType === 'admin';
    
    if (!isBookingUser && !isVenueHost && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You are not authorized to modify this booking' });
    }
    
    // Additional validation for who can change to what status
    if (status === 'confirmed' && !isVenueHost && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only venue hosts or admins can confirm bookings' });
    }
    
    // If cancelling a booking that was confirmed, increase the available rooms count
    if (status === 'cancelled' && booking.status === 'confirmed') {
      await RoomType.findByIdAndUpdate(booking.roomType, {
        $inc: { availableRooms: 1 }
      });
      
      // Add cancellation details
      booking.cancellation = {
        date: new Date(),
        reason: req.body.reason || 'No reason provided'
      };
    }
    
    booking.status = status;
    await booking.save();
    
    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: {
        booking
      }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
});

// Admin route to get all bookings
router.get('/admin/bookings', auth, async (req, res) => {
  try {
    // Check if the user is an admin
    const user = await User.findById(req.user.id);
    
    if (!user || user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
    
    const bookings = await Booking.find({})
      .populate('venue', 'name images address')
      .populate('roomType', 'name pricePerNight')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        bookings
      }
    });
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// Check room availability (public endpoint)
router.get('/check-availability/:roomTypeId', async (req, res) => {
  try {
    const { roomTypeId } = req.params;
    const { checkInDate, checkOutDate } = req.query;
    
    if (!roomTypeId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room type ID, check-in date, and check-out date are required' 
      });
    }
    
    // Validate dates
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }
    
    if (startDate >= endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Check-out date must be after check-in date' 
      });
    }
    
    const isAvailable = await Booking.isRoomTypeAvailable(roomTypeId, checkInDate, checkOutDate);
    
    res.json({
      success: true,
      data: {
        available: isAvailable
      }
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ success: false, message: 'Failed to check availability' });
  }
});

module.exports = router; 