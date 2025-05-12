const mongoose = require('mongoose');

const VenueHostSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  venueName: {
    type: String,
    required: true,
    trim: true
  },
  venueType: {
    type: String,
    required: true,
    enum: ['restaurant', 'hotel', 'resort', 'banquet_hall', 'conference_center', 'other'],
    trim: true
  },
  venueLocation: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
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
  images: [{
    type: String
  }],
  logo: {
    type: String,
    default: '/default-venue-logo.png'
  },
  coverImage: {
    type: String
  },
  website: {
    type: String,
    trim: true
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String
  },
  businessAddress: {
    street: String,
    city: String,
    district: String,
    postalCode: String,
    country: { type: String, default: 'Sri Lanka' }
  },
  businessRegistrationNumber: {
    type: String,
    trim: true
  },
  taxId: {
    type: String,
    trim: true
  },
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  cuisine: [{
    type: String,
    trim: true
  }],
  specialDiets: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten_free', 'halal', 'kosher', 'dairy_free', 'nut_free'],
    trim: true
  }],
  verificationStatus: {
    isVerified: { type: Boolean, default: false },
    documents: [{
      type: String
    }],
    verificationDate: Date
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    bankName: String,
    branchName: String,
    swiftCode: String
  },
  venues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  }],
  reviews: [{
    rating: Number,
    comment: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true }
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
}, { collection: 'venue_hosts' });

// Update the updatedAt timestamp on every save
VenueHostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate average rating when reviews are modified
VenueHostSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
  } else {
    this.averageRating = 0;
  }
  next();
});

const VenueHost = mongoose.model('VenueHost', VenueHostSchema);

module.exports = VenueHost; 