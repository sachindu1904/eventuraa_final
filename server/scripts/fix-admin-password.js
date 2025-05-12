/**
 * Script to fix admin password
 * Run with: node fix-admin-password.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventuraa';

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the admin collection
    const adminCollection = mongoose.connection.collection('admins');

    // Find existing admin
    const admin = await adminCollection.findOne({ email: 'admin@eventuraa.lk' });

    if (!admin) {
      console.log('Admin account not found, creating one...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create admin document
      const result = await adminCollection.insertOne({
        name: 'System Administrator',
        email: 'admin@eventuraa.lk',
        password: hashedPassword,
        role: 'superadmin',
        permissions: {
          manageUsers: true,
          manageOrganizers: true,
          manageDoctors: true,
          manageEvents: true,
          manageContent: true,
          manageAdmins: true,
          viewReports: true,
          financialAccess: true
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Admin account created successfully');
      console.log('Document ID:', result.insertedId);
    } else {
      console.log('Found existing admin account, updating password...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Update the password
      const result = await adminCollection.updateOne(
        { _id: admin._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log('Admin password updated successfully');
      console.log('Matched count:', result.matchedCount);
      console.log('Modified count:', result.modifiedCount);
    }

    // Verify the admin account
    const updatedAdmin = await adminCollection.findOne({ email: 'admin@eventuraa.lk' });
    console.log('Admin account details:');
    console.log('- Email:', updatedAdmin.email);
    console.log('- Name:', updatedAdmin.name);
    console.log('- Role:', updatedAdmin.role);
    console.log('- Password:', updatedAdmin.password ? 'Set' : 'Not set');
    console.log('- Password hash length:', updatedAdmin.password ? updatedAdmin.password.length : 'N/A');
    
    // Test password verification
    if (updatedAdmin.password) {
      const isPasswordCorrect = await bcrypt.compare('admin123', updatedAdmin.password);
      console.log('Password verification test:', isPasswordCorrect ? 'PASSED' : 'FAILED');
    }

    console.log('Admin login credentials:');
    console.log('Email: admin@eventuraa.lk');
    console.log('Password: admin123');

    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 