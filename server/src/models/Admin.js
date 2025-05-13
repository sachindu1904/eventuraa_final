const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
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
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'manager', 'support', 'content'],
    default: 'manager'
  },
  profileImage: {
    type: String,
    default: ''
  },
  permissions: {
    manageUsers: {
      type: Boolean,
      default: false
    },
    manageOrganizers: {
      type: Boolean,
      default: false
    },
    manageDoctors: {
      type: Boolean,
      default: false
    },
    manageEvents: {
      type: Boolean,
      default: false
    },
    manageVenues: {
      type: Boolean,
      default: false
    },
    manageVenueHosts: {
      type: Boolean,
      default: false
    },
    manageContent: {
      type: Boolean,
      default: false
    },
    manageAdmins: {
      type: Boolean,
      default: false
    },
    viewReports: {
      type: Boolean,
      default: true
    },
    financialAccess: {
      type: Boolean,
      default: false
    }
  },
  lastLogin: {
    type: Date
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
}, { collection: 'admins' });

// Hash the password before saving
AdminSchema.pre('save', async function(next) {
  try {
    // Update the timestamp
    this.updatedAt = Date.now();
    
    // Only hash the password if it's modified or new
    if (!this.isModified('password')) {
      return next();
    }
    
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password with the new salt
    const hashedPassword = await bcrypt.hash(this.password, salt);
    
    // Replace plain text password with hashed one
    this.password = hashedPassword;
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to validate password
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparing password:', candidatePassword, 'with hash:', this.password);
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    throw new Error('Authentication failed');
  }
};

const Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin; 