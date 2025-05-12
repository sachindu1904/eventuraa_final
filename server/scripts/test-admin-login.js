/**
 * Script to test admin login functionality
 * Run with: node test-admin-login.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventuraa';
const JWT_SECRET = process.env.JWT_SECRET || 'eventuraa-secret-key';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Admin schema definition
const AdminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  permissions: Object,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'admins' });

// Add comparePassword method to schema
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

const Admin = mongoose.model('Admin', AdminSchema);

async function testAdminLogin() {
  try {
    const email = 'admin@eventuraa.lk';
    const password = 'admin123';
    
    console.log('Testing admin login with:');
    console.log('Email:', email);
    console.log('Password:', password);
    
    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (!admin) {
      console.error('No admin found with this email. Please run create-admin.js first.');
      process.exit(1);
    }
    
    console.log('Admin found:', admin.name, `(${admin.email})`);
    
    // Test password comparison
    console.log('Testing password...');
    const isPasswordValid = await admin.comparePassword(password);
    
    if (isPasswordValid) {
      console.log('✅ Password is valid!');
      
      // Generate JWT token
      const token = jwt.sign(
        { id: admin._id, userType: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log('JWT Token (for testing):', token);
    } else {
      console.error('❌ Password is invalid!');
      console.log('Stored password hash:', admin.password);
    }
    
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('Test completed.');
    
  } catch (error) {
    console.error('Error testing admin login:', error);
    process.exit(1);
  }
}

testAdminLogin(); 