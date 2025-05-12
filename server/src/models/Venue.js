const mongoose = require('mongoose');

const VenueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['restaurant', 'hotel', 'resort', 'banquet_hall', 'conference_center', 'other'],
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    district: String,
    postalCode: String,
    country: { type: String, default: 'Sri Lanka' }
  },
  facilities: [{
    type: String,
    trim: true
  }],
  amenities: [{
    type: String,
    trim: true
  }],
  capacity: {
    min: Number,
    max: Number
  },
  priceRange: {
    currency: { type: String, default: 'LKR' },
    min: Number,
    max: Number
  },
  imageUrl: String,
  venueHost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VenueHost',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'venues' });

// Update the updatedAt timestamp on every save
VenueSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Venue = mongoose.model('Venue', VenueSchema);

module.exports = Venue; 