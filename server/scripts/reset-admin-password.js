require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa';

// Admin credentials
const adminEmail = 'admin@eventuraa.lk';
const newPassword = 'admin123';

async function resetAdminPassword() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');

    // Import the models
    const Credentials = require('../src/models/Credentials');
    
    // Find the admin credentials
    console.log(`Looking for admin credentials with email: ${adminEmail}`);
    
    const credentials = await Credentials.findOne({ 
      email: adminEmail,
      userType: 'admin'
    });
    
    if (!credentials) {
      console.log('Admin credentials not found!');
      await mongoose.connection.close();
      return;
    }
    
    console.log(`Admin credentials found: ${credentials._id}`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    credentials.password = hashedPassword;
    await credentials.save();
    
    console.log('Admin password reset successfully!');
    console.log('New password:', newPassword);
    
    // Try to verify the password works
    const isValid = await credentials.comparePassword(newPassword);
    console.log('Password verification:', isValid ? 'SUCCESS' : 'FAILED');
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
  }
}

resetAdminPassword(); 