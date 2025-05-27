const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  specialty: {
    type: String,
    required: true
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: String
  }],
  regNumber: {
    type: String,
    required: true,
    unique: true
  },
  experience: {
    type: Number,
    default: 0
  },
  hospital: String,
  profileImage: String,
  consultationFee: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  languages: [String],
  practices: [{
    hospitalName: String,
    address: String,
    city: String,
    country: String
  }],
  availability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    slots: [{
      startTime: String,
      endTime: String
    }]
  }],
  verificationStatus: {
    isVerified: {
      type: Boolean,
      default: false
    },
    documents: [String],
    verificationDate: Date
  },
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search by specialty
doctorSchema.index({ specialty: 'text', name: 'text' });
// Index for verification status
doctorSchema.index({ 'verificationStatus.isVerified': 1 });
// Index for active status
doctorSchema.index({ isActive: 1 });

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor; 