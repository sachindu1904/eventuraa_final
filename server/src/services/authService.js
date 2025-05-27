const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Organizer = require('../models/Organizer');
const VenueHost = require('../models/VenueHost');
const Credentials = require('../models/Credentials');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'eventuraa-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

/**
 * Register a new user
 * @param {Object} userData User data
 * @param {string} userType Type of user: 'user', 'doctor', 'organizer', or 'venue-host'
 * @returns {Object} Created user and credentials
 */
exports.register = async (userData, userType) => {
  try {
    console.log(`[AUTH SERVICE] Starting user registration. Type: ${userType}`);
    console.log(`[AUTH SERVICE] User data received:`, JSON.stringify(userData, null, 2));
    
    let user;
    let userModel;
    
    // Create the appropriate user model based on userType
    switch (userType) {
      case 'user':
        console.log('[AUTH SERVICE] Creating User document...');
        userModel = User;
        user = await User.create({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          phone: userData.phone || '',
          // Additional user fields if provided
          ...(userData.dateOfBirth && { dateOfBirth: userData.dateOfBirth }),
          ...(userData.gender && { gender: userData.gender }),
          ...(userData.address && { address: userData.address })
        });
        console.log(`[AUTH SERVICE] User document created: ${user._id}`);
        break;
        
      case 'doctor':
        console.log('[AUTH SERVICE] Creating Doctor document...');
        
        // Validate required doctor fields
        if (!userData.regNumber || !userData.specialty) {
          throw new Error('Doctor registration requires regNumber and specialty');
        }
        
        // First create a User document
        console.log('[AUTH SERVICE] Creating User document for doctor...');
        const doctorUser = await User.create({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: 'doctor',
          phone: userData.phone || '',
          // Additional user fields if provided
          ...(userData.dateOfBirth && { dateOfBirth: userData.dateOfBirth }),
          ...(userData.gender && { gender: userData.gender }),
          ...(userData.address && { address: userData.address })
        });
        console.log(`[AUTH SERVICE] User document created for doctor: ${doctorUser._id}`);
        
        // Then create the Doctor document with userId reference
        userModel = Doctor;
        user = await Doctor.create({
          userId: doctorUser._id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          regNumber: userData.regNumber,
          specialty: userData.specialty,
          // Additional doctor fields if provided
          ...(userData.qualifications && { qualifications: userData.qualifications }),
          ...(userData.bio && { bio: userData.bio }),
          ...(userData.experience && { experience: userData.experience })
        });
        console.log(`[AUTH SERVICE] Doctor document created: ${user._id}`);
        
        // Use the User document for credentials, not the Doctor document
        user = doctorUser;
        userModel = User; // Set userModel to User for verification
        break;
        
      case 'organizer':
        console.log('[AUTH SERVICE] Creating Organizer document...');
        userModel = Organizer;
        
        // Validate required organizer fields
        if (!userData.companyName) {
          throw new Error('Organizer registration requires companyName');
        }
        
        user = await Organizer.create({
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          companyName: userData.companyName,
          businessType: userData.businessType || '',
          // Additional organizer fields if provided
          ...(userData.description && { description: userData.description }),
          ...(userData.website && { website: userData.website }),
          ...(userData.businessAddress && { businessAddress: userData.businessAddress })
        });
        console.log(`[AUTH SERVICE] Organizer document created: ${user._id}`);
        break;
        
      case 'venue-host':
        console.log('[AUTH SERVICE] Creating VenueHost document...');
        userModel = VenueHost;
        
        // Validate required venue host fields
        if (!userData.venueName || !userData.venueType) {
          throw new Error('Venue Host registration requires venueName and venueType');
        }
        
        user = await VenueHost.create({
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          venueName: userData.venueName,
          venueType: userData.venueType,
          venueLocation: userData.venueLocation || '',
          // Additional venue host fields if provided
          ...(userData.description && { description: userData.description }),
          ...(userData.website && { website: userData.website }),
          ...(userData.businessAddress && { businessAddress: userData.businessAddress })
        });
        console.log(`[AUTH SERVICE] VenueHost document created: ${user._id}`);
        break;
        
      default:
        throw new Error('Invalid user type');
    }
    
    // Print the collections in the database
    console.log('[AUTH SERVICE] Checking available collections...');
    try {
      const collections = await userModel.db.db.listCollections().toArray();
      console.log('[AUTH SERVICE] Available collections:', collections.map(c => c.name));
    } catch (err) {
      console.error('[AUTH SERVICE] Could not list collections:', err);
    }
    
    // Create credentials for the user
    console.log('[AUTH SERVICE] Creating credentials document...');
    const credentials = await Credentials.create({
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      userType,
      userId: user._id,
      userModel: userType === 'user' 
        ? 'User' 
        : userType === 'doctor' 
          ? 'User'  // Changed from 'Doctor' to 'User' since userId now points to User
          : userType === 'organizer'
            ? 'Organizer'
            : 'VenueHost',
      verificationToken: crypto.randomBytes(20).toString('hex')
    });
    console.log(`[AUTH SERVICE] Credentials document created: ${credentials._id}`);
    
    // Double check that user was saved by fetching it
    console.log('[AUTH SERVICE] Verifying user was saved by fetching it...');
    const savedUser = await userModel.findById(user._id);
    if (savedUser) {
      console.log('[AUTH SERVICE] User document verified in database.');
    } else {
      console.error('[AUTH SERVICE] WARNING: User document not found after creation!');
    }
    
    const token = generateToken(user._id, userType);
    console.log('[AUTH SERVICE] Registration completed successfully.');
    
    return {
      user,
      credentials,
      token
    };
  } catch (error) {
    console.error('[AUTH SERVICE] Registration error:', error);
    console.error('[AUTH SERVICE] Error stack:', error.stack);
    throw error;
  }
};

/**
 * Login a user
 * @param {string} emailOrPhone User email or phone
 * @param {string} password User password
 * @param {string} userType Type of user making the login request
 * @param {string} regNumber Doctor registration number (only for doctor login)
 * @returns {Object} User data and token
 */
exports.login = async (emailOrPhone, password, userType, regNumber = null) => {
  try {
    console.log(`[AUTH SERVICE] Login attempt for ${emailOrPhone} as ${userType}`);
    
    // Special handling for admin login
    if (userType === 'admin') {
      console.log(`[AUTH SERVICE] Admin login attempt for ${emailOrPhone}`);
      const Admin = require('../models/Admin');
      
      // Find admin directly by email
      const admin = await Admin.findOne({ email: emailOrPhone.toLowerCase().trim() });
      
      if (!admin) {
        console.log(`[AUTH SERVICE] No admin found with email: ${emailOrPhone}`);
        throw new Error('Invalid credentials');
      }
      
      // Check if admin account is active
      if (!admin.isActive) {
        console.log(`[AUTH SERVICE] Admin account is inactive: ${emailOrPhone}`);
        throw new Error('Your account has been deactivated. Please contact support.');
      }
      
      // Compare password directly with the Admin model's comparePassword method
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        console.log(`[AUTH SERVICE] Invalid password for admin: ${emailOrPhone}`);
        throw new Error('Invalid credentials');
      }
      
      console.log(`[AUTH SERVICE] Admin password is valid for: ${emailOrPhone}`);
      
      // Update last login
      admin.lastLogin = Date.now();
      await admin.save();
      
      const token = generateToken(admin._id, 'admin');
      console.log(`[AUTH SERVICE] Admin login successful for: ${emailOrPhone}`);
      
      return {
        user: admin,
        userType: 'admin',
        token
      };
    }
    
    // Regular user authentication flow (for non-admin users)
    // Determine if input is email or phone
    const isEmail = emailOrPhone.includes('@');
    const searchField = isEmail ? 'email' : 'phone';
    console.log(`[AUTH SERVICE] Login with ${searchField}: ${emailOrPhone}`);
    
    // Find the credentials - can look up by either email or phone
    const credentials = await Credentials.findOne({ 
      [searchField]: emailOrPhone.toLowerCase().trim() 
    });
    
    if (!credentials) {
      console.log(`[AUTH SERVICE] No credentials found for ${searchField}: ${emailOrPhone}`);
      throw new Error('Invalid credentials');
    }
    
    console.log(`[AUTH SERVICE] Credentials found for user type: ${credentials.userType}`);
    
    // Check if the user type matches the requested type
    if (credentials.userType !== userType) {
      console.log(`[AUTH SERVICE] User type mismatch. Found: ${credentials.userType}, Requested: ${userType}`);
      throw new Error(`Account exists but as a ${credentials.userType}, not as a ${userType}`);
    }
    
    // Additional validation for doctors - check registration number
    if (userType === 'doctor' && regNumber) {
      // For doctors, find the doctor record by the user's email since credentials.userId now points to User
      const user = await User.findById(credentials.userId);
      if (!user) {
        throw new Error('User record not found');
      }
      
      const doctor = await Doctor.findOne({ email: user.email });
      if (!doctor) {
        throw new Error('Doctor record not found');
      }
      
      if (doctor.regNumber !== regNumber) {
        console.log(`[AUTH SERVICE] Invalid registration number for doctor: ${user.email}`);
        throw new Error('Invalid registration number');
      }
    }
    
    // Verify the password
    const isPasswordValid = await credentials.comparePassword(password);
    if (!isPasswordValid) {
      console.log(`[AUTH SERVICE] Invalid password for ${searchField}: ${emailOrPhone}`);
      throw new Error('Invalid credentials');
    }
    console.log(`[AUTH SERVICE] Password is valid for ${searchField}: ${emailOrPhone}`);
    
    // Update last login
    credentials.lastLogin = Date.now();
    await credentials.save();
    
    // Get the user data from the appropriate model
    let user;
    let userModel;
    switch (credentials.userType) {
      case 'user':
        userModel = User;
        break;
      case 'doctor':
        userModel = User; // For doctors, use User model since credentials.userId points to User
        break;
      case 'organizer':
        userModel = Organizer;
        break;
      case 'venue-host':
        userModel = VenueHost;
        break;
      default:
        throw new Error('Invalid user type in credentials');
    }
    
    user = await userModel.findById(credentials.userId);
    
    if (!user) {
      console.error(`[AUTH SERVICE] User document not found for ID: ${credentials.userId}`);
      throw new Error('User not found');
    }
    console.log(`[AUTH SERVICE] User document found: ${user._id}, Type: ${credentials.userType}`);
    
    const token = generateToken(user._id, credentials.userType);
    console.log(`[AUTH SERVICE] Login successful for ${searchField}: ${emailOrPhone}`);
    
    return {
      user,
      userType: credentials.userType,
      token
    };
  } catch (error) {
    console.error('[AUTH SERVICE] Login error:', error);
    throw error;
  }
};

/**
 * Verify user email
 * @param {string} token Verification token
 * @returns {boolean} Verification result
 */
exports.verifyEmail = async (token) => {
  try {
    const credentials = await Credentials.findOne({ verificationToken: token });
    if (!credentials) {
      throw new Error('Invalid verification token');
    }
    
    credentials.isVerified = true;
    credentials.verificationToken = undefined;
    await credentials.save();
    
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Request password reset
 * @param {string} email User email
 * @returns {string} Reset token
 */
exports.requestPasswordReset = async (email) => {
  try {
    const credentials = await Credentials.findOne({ email });
    if (!credentials) {
      throw new Error('User not found');
    }
    
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    credentials.resetPasswordToken = resetToken;
    credentials.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await credentials.save();
    
    return resetToken;
  } catch (error) {
    throw error;
  }
};

/**
 * Reset password
 * @param {string} token Reset token
 * @param {string} newPassword New password
 * @returns {boolean} Reset result
 */
exports.resetPassword = async (token, newPassword) => {
  try {
    const credentials = await Credentials.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!credentials) {
      throw new Error('Invalid or expired token');
    }
    
    credentials.password = newPassword;
    credentials.resetPasswordToken = undefined;
    credentials.resetPasswordExpires = undefined;
    await credentials.save();
    
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Generate JWT token
 * @param {string} userId User ID
 * @param {string} userType User type
 * @returns {string} JWT token
 */
const generateToken = (userId, userType) => {
  return jwt.sign(
    { id: userId, userType },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
}; 