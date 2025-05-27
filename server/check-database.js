const mongoose = require('mongoose');
const Credentials = require('./src/models/Credentials');
const User = require('./src/models/User');
const Admin = require('./src/models/Admin');
const Doctor = require('./src/models/Doctor');
const Organizer = require('./src/models/Organizer');
const VenueHost = require('./src/models/VenueHost');

// Use the same connection string as the main app
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa';

async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully');
    
    // Check collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Check credentials
    console.log('\n=== CREDENTIALS ===');
    const credentials = await Credentials.find({});
    console.log(`Total credentials: ${credentials.length}`);
    
    if (credentials.length > 0) {
      credentials.forEach((cred, index) => {
        console.log(`${index + 1}. Email: ${cred.email}, Type: ${cred.userType}, UserId: ${cred.userId}`);
      });
    } else {
      console.log('No credentials found in database');
    }
    
    // Check users
    console.log('\n=== USERS ===');
    const users = await User.find({});
    console.log(`Total users: ${users.length}`);
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.name}, Email: ${user.email}, ID: ${user._id}`);
      });
    }
    
    // Check admins
    console.log('\n=== ADMINS ===');
    const admins = await Admin.find({});
    console.log(`Total admins: ${admins.length}`);
    
    if (admins.length > 0) {
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. Name: ${admin.name}, Email: ${admin.email}, ID: ${admin._id}, Active: ${admin.isActive}`);
      });
    }
    
    // Check doctors
    console.log('\n=== DOCTORS ===');
    const doctors = await Doctor.find({});
    console.log(`Total doctors: ${doctors.length}`);
    
    if (doctors.length > 0) {
      doctors.forEach((doctor, index) => {
        console.log(`${index + 1}. Name: ${doctor.name}, Email: ${doctor.email}, RegNumber: ${doctor.regNumber}, ID: ${doctor._id}`);
      });
    }
    
    // Check organizers
    console.log('\n=== ORGANIZERS ===');
    const organizers = await Organizer.find({});
    console.log(`Total organizers: ${organizers.length}`);
    
    if (organizers.length > 0) {
      organizers.forEach((organizer, index) => {
        console.log(`${index + 1}. Name: ${organizer.name}, Email: ${organizer.email}, Company: ${organizer.companyName}, ID: ${organizer._id}`);
      });
    }
    
    // Check venue hosts
    console.log('\n=== VENUE HOSTS ===');
    const venueHosts = await VenueHost.find({});
    console.log(`Total venue hosts: ${venueHosts.length}`);
    
    if (venueHosts.length > 0) {
      venueHosts.forEach((host, index) => {
        console.log(`${index + 1}. Name: ${host.name}, Email: ${host.email}, Venue: ${host.venueName}, ID: ${host._id}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkDatabase(); 