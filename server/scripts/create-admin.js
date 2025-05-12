/**
 * Script to create an admin user directly in MongoDB
 * Run with: node create-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventuraa';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define the Admin schema
const AdminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  role: String,
  profileImage: String,
  permissions: {
    manageUsers: Boolean,
    manageOrganizers: Boolean,
    manageDoctors: Boolean,
    manageEvents: Boolean,
    manageContent: Boolean,
    manageAdmins: Boolean,
    viewReports: Boolean,
    financialAccess: Boolean
  },
  lastLogin: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'admins' });

const Admin = mongoose.model('Admin', AdminSchema);

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@eventuraa.lk' });
    
    if (existingAdmin) {
      console.log('Admin account already exists:', existingAdmin.email);
      process.exit(0);
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Create the admin account
    const admin = new Admin({
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
    
    await admin.save();
    
    console.log('Admin account created successfully');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin account:', error);
    process.exit(1);
  }
}

createAdmin(); 