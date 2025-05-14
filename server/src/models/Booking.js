const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
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
    // Not required initially as it will be assigned during processing
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  guests: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'],
    default: 'pending'
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
  payment: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'refunded', 'refund_pending'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['credit_card', 'paypal', 'ezcash', 'alipay'],
      required: true
    },
    transactionId: {
      type: String
    },
    refundId: {
      type: String
    },
    refundReason: {
      type: String
    },
    refundDate: {
      type: Date
    },
    cardLastFour: {
      type: String
    }
  },
  bookingReference: {
    type: String,
    unique: true
    // Will be generated on creation
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // May be null for non-registered users
  },
  venueHost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rejectionReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'bookings' });

// Generate a unique booking reference before saving
BookingSchema.pre('save', async function(next) {
  // Only generate reference for new bookings
  if (this.isNew) {
    // Generate a random alphanumeric string
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    // Use current date as prefix (YYMMDD)
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    this.bookingReference = `BK${datePrefix}${randomPart}`;
  }
  
  // Update the updatedAt timestamp
  this.updatedAt = Date.now();
  next();
});

const Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking; 