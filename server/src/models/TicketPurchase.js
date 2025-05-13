const mongoose = require('mongoose');

const TicketPurchaseSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  tickets: [{
    ticketNumber: {
      type: String,
      required: true,
      unique: true
    },
    ticketType: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['valid', 'used', 'cancelled', 'refunded'],
      default: 'valid'
    },
    attendeeInfo: {
      name: String,
      email: String,
      phone: String
    }
  }],
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  totalAmount: {
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
      enum: ['credit-card', 'paypal'],
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
      paypalEmail: String,
      paypalTransactionId: String
    }
  },
  contactInfo: {
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled', 'refunded'],
    default: 'confirmed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'ticketPurchases' });

// Update the updatedAt timestamp on every save
TicketPurchaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate unique transaction ID and ticket numbers before saving
TicketPurchaseSchema.pre('save', async function(next) {
  try {
    // Only generate IDs for new documents
    if (this.isNew) {
      // Generate transaction ID if not provided
      if (!this.transactionId) {
        const timestamp = new Date().getTime();
        const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.transactionId = `TXN-${timestamp}-${randomPart}`;
      }

      // Generate ticket numbers for each ticket
      if (this.tickets && this.tickets.length > 0) {
        for (let i = 0; i < this.tickets.length; i++) {
          if (!this.tickets[i].ticketNumber) {
            const timestamp = new Date().getTime();
            const randomPart = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
            const ticketIndex = (i + 1).toString().padStart(3, '0');
            this.tickets[i].ticketNumber = `TCKT-${timestamp.toString().slice(-6)}-${randomPart}-${ticketIndex}`;
          }
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

const TicketPurchase = mongoose.model('TicketPurchase', TicketPurchaseSchema);

module.exports = TicketPurchase; 