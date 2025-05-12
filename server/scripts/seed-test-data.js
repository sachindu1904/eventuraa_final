require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Organizer = require('../src/models/Organizer');
const Admin = require('../src/models/Admin');
const Credentials = require('../src/models/Credentials');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa';

async function connectDB() {
  try {
    console.log('Connecting to MongoDB:', MONGO_URI);
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
}

async function createAdminCredentials(adminId, email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const credentials = new Credentials({
    email,
    password: hashedPassword,
    userType: 'admin',
    userId: adminId
  });
  
  return credentials.save();
}

async function seedTestData() {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@eventuraa.lk' });
    
    if (existingAdmin) {
      console.log('Admin account already exists');
    } else {
      // Create a superadmin account
      const admin = new Admin({
        name: 'Super Admin',
        email: 'admin@eventuraa.lk',
        phone: '+94123456789',
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
        isActive: true
      });
      
      const savedAdmin = await admin.save();
      await createAdminCredentials(savedAdmin._id, 'admin@eventuraa.lk', 'admin123');
      console.log('Created admin account');
    }
    
    // Check if users already exist
    const userCount = await User.countDocuments();
    
    if (userCount > 0) {
      console.log(`${userCount} users already exist`);
    } else {
      // Create sample users
      const users = [
        { name: 'John Doe', email: 'johndoe@example.com', isActive: true },
        { name: 'Jane Smith', email: 'janesmith@example.com', isActive: true },
        { name: 'Bob Johnson', email: 'bob@example.com', isActive: false },
        { name: 'Alice Williams', email: 'alice@example.com', isActive: true },
        { name: 'Charlie Brown', email: 'charlie@example.com', isActive: true }
      ];
      
      await User.insertMany(users);
      console.log(`Created ${users.length} sample users`);
    }
    
    // Check if organizers already exist
    const organizerCount = await Organizer.countDocuments();
    
    if (organizerCount > 0) {
      console.log(`${organizerCount} organizers already exist`);
    } else {
      // Create sample organizers
      const organizers = [
        { 
          name: 'Event Masters', 
          companyName: 'Event Masters Ltd',
          email: 'info@eventmasters.lk', 
          phone: '+94111234567',
          isActive: true,
          verificationStatus: { isVerified: true, documents: ['business_reg.pdf'] },
          events: []
        },
        { 
          name: 'Party Planners', 
          companyName: 'Party Planners International',
          email: 'contact@partyplanners.lk', 
          phone: '+94112345678',
          isActive: true,
          verificationStatus: { isVerified: true, documents: ['license.pdf'] },
          events: []
        },
        { 
          name: 'Wedding Wonders', 
          companyName: 'Wedding Wonders (Pvt) Ltd',
          email: 'hello@weddingwonders.lk', 
          phone: '+94113456789',
          isActive: true,
          verificationStatus: { isVerified: false, documents: [] },
          events: []
        },
        { 
          name: 'Corporate Events Co', 
          companyName: 'Corporate Events Company',
          email: 'corp@eventco.lk', 
          phone: '+94114567890',
          isActive: false,
          verificationStatus: { isVerified: true, documents: ['registration.pdf'] },
          events: []
        },
        { 
          name: 'Music Festivals Inc', 
          companyName: 'Music Festivals Incorporated',
          email: 'bookings@musicfest.lk', 
          phone: '+94115678901',
          isActive: true,
          verificationStatus: { isVerified: false, documents: ['pending_doc.pdf'] },
          events: []
        }
      ];
      
      await Organizer.insertMany(organizers);
      console.log(`Created ${organizers.length} sample organizers`);
    }
    
    // Check if doctors already exist
    const doctorCount = await Doctor.countDocuments();
    
    if (doctorCount > 0) {
      console.log(`${doctorCount} doctors already exist`);
    } else {
      // Create sample doctors
      const doctors = [
        { 
          name: 'Dr. Sarah Johnson', 
          email: 'dr.sarah@example.com', 
          phone: '+94771234567',
          regNumber: 'SLMC12345',
          specialty: 'Cardiology',
          isActive: true,
          verificationStatus: { isVerified: true, documents: ['medical_license.pdf'] },
          appointments: []
        },
        { 
          name: 'Dr. David Lee', 
          email: 'dr.lee@example.com', 
          phone: '+94772345678',
          regNumber: 'SLMC23456',
          specialty: 'Pediatrics',
          isActive: true,
          verificationStatus: { isVerified: true, documents: ['certification.pdf'] },
          appointments: []
        },
        { 
          name: 'Dr. Maria Garcia', 
          email: 'dr.garcia@example.com', 
          phone: '+94773456789',
          regNumber: 'SLMC34567',
          specialty: 'Dermatology',
          isActive: true,
          verificationStatus: { isVerified: false, documents: [] },
          appointments: []
        },
        { 
          name: 'Dr. James Wilson', 
          email: 'dr.wilson@example.com', 
          phone: '+94774567890',
          regNumber: 'SLMC45678',
          specialty: 'Orthopedics',
          isActive: false,
          verificationStatus: { isVerified: true, documents: ['license_copy.pdf'] },
          appointments: []
        },
        { 
          name: 'Dr. Emily Chan', 
          email: 'dr.chan@example.com', 
          phone: '+94775678901',
          regNumber: 'SLMC56789',
          specialty: 'Psychiatry',
          isActive: true,
          verificationStatus: { isVerified: false, documents: ['pending_verification.pdf'] },
          appointments: []
        }
      ];
      
      await Doctor.insertMany(doctors);
      console.log(`Created ${doctors.length} sample doctors`);
    }
    
    console.log('Data seeding completed');
  } catch (error) {
    console.error('Error seeding test data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

connectDB().then(() => {
  seedTestData();
}); 