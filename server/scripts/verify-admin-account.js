/**
 * Script to verify the admin account structure in MongoDB
 * Run with: node verify-admin-account.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventuraa';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function verifyAdminAccount() {
  try {
    // Connect to the admin collection directly
    const db = mongoose.connection.db;
    const adminCollection = db.collection('admins');
    
    // Find admin document
    const admin = await adminCollection.findOne({ email: 'admin@eventuraa.lk' });
    
    if (!admin) {
      console.error('No admin found with email: admin@eventuraa.lk');
      console.log('Running admin creation script...');
      
      // Execute create-admin script
      require('./create-admin');
      return;
    }
    
    console.log('Found admin document:');
    console.log(JSON.stringify(admin, null, 2));
    
    // Verify password field
    if (!admin.password) {
      console.error('WARNING: Admin document does not have a password field!');
      console.log('This will cause login failures.');
      
      console.log('Updating admin document with password...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const result = await adminCollection.updateOne(
        { _id: admin._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log('Update result:', result);
      
      // Verify the update
      const updatedAdmin = await adminCollection.findOne({ email: 'admin@eventuraa.lk' });
      console.log('Updated admin password:', updatedAdmin.password ? 'Set successfully' : 'Still missing');
    } else {
      console.log('Password field exists, length:', admin.password.length);
    }
    
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('Verification completed');
    
  } catch (error) {
    console.error('Error verifying admin account:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

verifyAdminAccount(); 