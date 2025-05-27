const mongoose = require('mongoose');
const Admin = require('./src/models/Admin');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Test admin credentials
const testAdmin = {
  name: 'Admin User',
  email: 'admin2@eventuraa.lk',
  password: 'Admin123!',
  phone: '1234567890',
  role: 'superadmin',
  permissions: {
    manageUsers: true,
    manageOrganizers: true,
    manageDoctors: true,
    manageEvents: true,
    manageVenues: true,
    manageVenueHosts: true,
    manageContent: true,
    manageAdmins: true,
    viewReports: true,
    financialAccess: true
  },
  isActive: true
};

// Create the admin user
const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: testAdmin.email });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      existingAdmin.password = testAdmin.password;
      await existingAdmin.save();
      console.log('Admin password updated successfully');
    } else {
      // Create new admin
      const newAdmin = new Admin(testAdmin);
      await newAdmin.save();
      console.log('Admin user created successfully');
    }
    
    console.log('===================================');
    console.log('Admin Login Details:');
    console.log('Email:', testAdmin.email);
    console.log('Password:', testAdmin.password);
    console.log('URL: /admin-login');
    console.log('===================================');
    
    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the function
createAdmin(); 