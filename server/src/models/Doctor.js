const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
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
    trim: true
  },
  regNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  specialty: {
    type: String,
    required: true,
    trim: true
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  experience: {
    type: Number, // Years of experience
    default: 0
  },
  profileImage: {
    type: String,
    default: '/default-doctor-avatar.png'
  },
  bio: {
    type: String,
    trim: true
  },
  verificationStatus: {
    isVerified: { type: Boolean, default: false },
    documents: [{
      type: String
    }],
    verificationDate: Date
  },
  practices: [{
    hospitalName: String,
    address: {
      street: String,
      city: String,
      district: String,
      postalCode: String,
      country: { type: String, default: 'Sri Lanka' }
    },
    position: String,
    contactNumber: String,
    workingHours: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      startTime: String,
      endTime: String,
      isAvailable: { type: Boolean, default: true }
    }]
  }],
  consultationFee: {
    amount: Number,
    currency: { type: String, default: 'LKR' }
  },
  specializations: [String],
  languages: [String],
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
  appointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  isAvailableForOnlineConsultation: {
    type: Boolean,
    default: false
  },
  onlineConsultationHours: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String,
    endTime: String,
    isAvailable: { type: Boolean, default: true }
  }],
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
}, { collection: 'doctors' });

// Update the updatedAt timestamp on every save
DoctorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate average rating when reviews are modified
DoctorSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
  } else {
    this.averageRating = 0;
  }
  next();
});

const Doctor = mongoose.model('Doctor', DoctorSchema);

module.exports = Doctor; 