require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa';

// Admin credentials
const adminEmail = 'admin@eventuraa.lk';
const testPassword = 'admin123';

async function debugPasswordComparison() {
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
    console.log('Stored hashed password:', credentials.password);
    
    // Create a completely new password hash for testing
    const salt = await bcrypt.genSalt(10);
    const manuallyHashedPassword = await bcrypt.hash(testPassword, salt);
    console.log('Manually created hash:', manuallyHashedPassword);
    
    // Test direct password comparison with bcrypt
    const directCompare = await bcrypt.compare(testPassword, credentials.password);
    console.log('Direct bcrypt comparison result:', directCompare ? 'SUCCESS' : 'FAILED');
    
    // Try fixing the password with direct DB update 
    console.log('\nAttempting to fix password with direct update...');
    await mongoose.connection.db.collection('credentials').updateOne(
      { _id: credentials._id },
      { $set: { password: manuallyHashedPassword } }
    );
    
    // Re-fetch the credentials
    const updatedCredentials = await Credentials.findById(credentials._id);
    console.log('Updated password hash:', updatedCredentials.password);
    
    // Test model method
    const modelCompare = await updatedCredentials.comparePassword(testPassword);
    console.log('Model method comparison result:', modelCompare ? 'SUCCESS' : 'FAILED');
    
    // Test direct comparison again
    const finalDirectCompare = await bcrypt.compare(testPassword, updatedCredentials.password);
    console.log('Final direct comparison result:', finalDirectCompare ? 'SUCCESS' : 'FAILED');
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Debug error:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
  }
}

debugPasswordComparison(); 