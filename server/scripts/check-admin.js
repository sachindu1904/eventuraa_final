require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa';

async function checkAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');

    // Import the models
    const Admin = require('../src/models/Admin');
    const Credentials = require('../src/models/Credentials');
    
    // Check if admin exists
    const adminEmail = 'admin@eventuraa.lk';
    
    console.log(`Checking for admin with email: ${adminEmail}`);
    
    const admin = await Admin.findOne({ email: adminEmail });
    console.log('Admin record:', admin ? `Found (ID: ${admin._id})` : 'Not found');
    
    if (admin) {
      const credentials = await Credentials.findOne({ 
        email: adminEmail,
        userType: 'admin',
        userId: admin._id
      });
      
      console.log('Credentials record:', credentials ? `Found (ID: ${credentials._id})` : 'Not found');
      
      if (credentials) {
        console.log('UserType:', credentials.userType);
        console.log('UserModel:', credentials.userModel);
        console.log('UserId:', credentials.userId);
        console.log('UserId matches admin._id:', credentials.userId.toString() === admin._id.toString());
      }
    }
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Error checking admin:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
  }
}

checkAdmin(); 