const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CredentialsSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  userType: {
    type: String,
    required: true,
    enum: ['user', 'organizer', 'doctor', 'admin'],
    default: 'user'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'Organizer', 'Doctor', 'Admin']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'credentials' });

// Pre-save middleware to hash password
CredentialsSchema.pre('save', async function(next) {
  const credentials = this;
  
  // Only hash the password if it's modified or new
  if (!credentials.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password with the salt
    const hashedPassword = await bcrypt.hash(credentials.password, salt);
    
    // Replace plaintext password with hashed password
    credentials.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
CredentialsSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Update the updatedAt timestamp on every save
CredentialsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Credentials = mongoose.model('Credentials', CredentialsSchema);

module.exports = Credentials; 