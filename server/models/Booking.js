const mongoose = require('mongoose');
const { generateBookingReference } = require('../utils/idGenerator');

const bookingSchema = new mongoose.Schema({
  bookingReference: {
    type: String,
    unique: true,
    default: () => generateBookingReference()
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  roomType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomType',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  nightCount: {
    type: Number,
    required: true
  },
  guests: {
    type: Number,
    required: true,
    min: 1
  },
  contactInfo: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  specialRequests: {
    type: String
  },
  totalPrice: {
    type: Number,
    required: true
  },
  serviceFee: {
    type: Number,
    required: true
  },
  payment: {
    method: {
      type: String,
      enum: ['credit_card', 'paypal', 'cash'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    details: {
      cardHolderName: String,
      lastFourDigits: String,
      transactionId: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  cancellation: {
    date: Date,
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'declined', 'none'],
      default: 'none'
    }
  }
}, {
  timestamps: true
});

// Index for efficient retrieval of bookings by venue host
bookingSchema.index({ venue: 1, createdAt: -1 });

// Index for user bookings
bookingSchema.index({ user: 1, createdAt: -1 });

// Index for checking availability (to prevent double-bookings)
// This helps query efficiently when checking for date overlaps
bookingSchema.index({ 
  roomType: 1, 
  checkInDate: 1, 
  checkOutDate: 1,
  status: 1
});

// Static method to check if a room is available for specific dates
bookingSchema.statics.isRoomTypeAvailable = async function(roomTypeId, checkInDate, checkOutDate, excludeBookingId = null) {
  // Convert dates to Date objects if they are strings
  const startDate = new Date(checkInDate);
  const endDate = new Date(checkOutDate);
  
  // Query to find any overlapping bookings for this room type
  const query = {
    roomType: roomTypeId,
    status: { $in: ['pending', 'confirmed'] }, // Only check pending and confirmed bookings
    // Find bookings where the date ranges overlap
    $or: [
      // Case 1: Booking check-in date falls within requested period
      { checkInDate: { $gte: startDate, $lt: endDate } },
      // Case 2: Booking check-out date falls within requested period
      { checkOutDate: { $gt: startDate, $lte: endDate } },
      // Case 3: Booking check-in date is before and check-out date is after requested period
      { $and: [{ checkInDate: { $lte: startDate } }, { checkOutDate: { $gte: endDate } }] }
    ]
  };
  
  // If we're updating an existing booking, exclude it from the search
  if (excludeBookingId) {
    query._id = { $ne: mongoose.Types.ObjectId(excludeBookingId) };
  }
  
  // Find all bookings for the specified room type that overlap with the requested dates
  const existingBookings = await this.find(query);
  
  // If bookings exist, check if there are available rooms
  if (existingBookings.length > 0) {
    // Get the room type details
    const RoomType = mongoose.model('RoomType');
    const roomTypeData = await RoomType.findById(roomTypeId);
    
    if (!roomTypeData) {
      throw new Error('Room type not found');
    }
    
    // Check if the number of existing bookings is less than the total available rooms
    return existingBookings.length < roomTypeData.totalRooms;
  }
  
  // If no bookings exist, the room type is available
  return true;
};

// Middleware to check availability before saving a booking
bookingSchema.pre('save', async function(next) {
  // Skip availability check if booking is being cancelled
  if (this.isModified('status') && this.status === 'cancelled') {
    return next();
  }
  
  // Check availability when creating a new booking or updating dates
  if (this.isNew || this.isModified('checkInDate') || this.isModified('checkOutDate') || this.isModified('roomType')) {
    const isAvailable = await this.constructor.isRoomTypeAvailable(
      this.roomType,
      this.checkInDate,
      this.checkOutDate,
      this._id
    );
    
    if (!isAvailable) {
      const error = new Error('This room is not available for the selected dates');
      error.name = 'AvailabilityError';
      return next(error);
    }
  }
  
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 