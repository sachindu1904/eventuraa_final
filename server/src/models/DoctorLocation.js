const mongoose = require('mongoose');

const doctorLocationSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    default: ''
  },
  zipCode: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  // Keep legacy fields for backward compatibility
  practiceName: String,
  coordinates: {
    lat: Number,
    lng: Number
  },
  contactNumber: String,
  isMainPractice: {
    type: Boolean,
    default: false
  },
  workingHours: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String,
    endTime: String,
    isAvailable: {
      type: Boolean,
      default: true
    }
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
});

// Update the updatedAt timestamp before saving
doctorLocationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // For backward compatibility, copy name to practiceName if practiceName is not set
  if (this.name && !this.practiceName) {
    this.practiceName = this.name;
  }
  next();
});

// Index for efficient querying
doctorLocationSchema.index({ doctor: 1, isActive: 1 });
doctorLocationSchema.index({ doctor: 1, isMainPractice: -1, createdAt: -1 });

const DoctorLocation = mongoose.model('DoctorLocation', doctorLocationSchema);

module.exports = DoctorLocation; 