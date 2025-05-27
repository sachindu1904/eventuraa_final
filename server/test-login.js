const mongoose = require('mongoose');
const Credentials = require('./src/models/Credentials');
const User = require('./src/models/User');
const Doctor = require('./src/models/Doctor');
const authService = require('./src/services/authService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa';

async function testLogin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully\n');
    
    // Test cases with correct passwords from seed data
    const testCases = [
      // Test admin login
      {
        email: 'admin@eventuraa.lk',
        password: 'Admin123!',
        userType: 'admin',
        description: 'Admin login'
      },
      // Test a user from credentials with correct password
      {
        email: 'john@example.com',
        password: 'Password123!', // Correct password from seed data
        userType: 'user',
        description: 'Regular user login'
      },
      // Test doctor login  
      {
        email: 'test.doctor@eventuraa.com',
        password: 'Password123!', // This doctor was created through registration
        userType: 'doctor',
        regNumber: 'TEST-12345',
        description: 'Doctor login with registration'
      },
      // Test another doctor with seeded password
      {
        email: 'sarah@doctor.com',
        password: 'Doctor123!', // Correct password from seed data
        userType: 'doctor',
        regNumber: 'SL-MED-1234',
        description: 'Seeded doctor login'
      },
      // Test organizer with seeded password - let me try without a password first to see what's expected
      {
        email: 'ashan@gmail.com',
        password: 'Password123!', // Try this first
        userType: 'organizer',
        description: 'Organizer login'
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n=== Testing ${testCase.description} ===`);
      console.log(`Email: ${testCase.email}`);
      console.log(`UserType: ${testCase.userType}`);
      
      try {
        const result = await authService.login(
          testCase.email, 
          testCase.password, 
          testCase.userType, 
          testCase.regNumber
        );
        
        console.log('✅ SUCCESS!');
        console.log(`User ID: ${result.user._id}`);
        console.log(`User Name: ${result.user.name}`);
        console.log(`Token generated: ${result.token ? 'Yes' : 'No'}`);
        
      } catch (error) {
        console.log('❌ FAILED!');
        console.log(`Error: ${error.message}`);
        
        // Additional debugging
        console.log('\n--- Debugging info ---');
        
        // Check if credentials exist
        const creds = await Credentials.findOne({ 
          email: testCase.email.toLowerCase().trim() 
        });
        
        if (creds) {
          console.log(`Credentials found: UserType=${creds.userType}, UserId=${creds.userId}`);
          
          // Check if corresponding user exists
          let userModel;
          switch (creds.userType) {
            case 'user':
              userModel = User;
              break;
            case 'doctor':
              userModel = User; // Since doctors now point to User
              break;
            case 'organizer':
              userModel = require('./src/models/Organizer');
              break;
            case 'venue-host':
              userModel = require('./src/models/VenueHost');
              break;
            case 'admin':
              userModel = require('./src/models/Admin');
              break;
          }
          
          if (userModel) {
            const user = await userModel.findById(creds.userId);
            if (user) {
              console.log(`User document found: Name=${user.name}, Email=${user.email}`);
            } else {
              console.log(`❌ User document NOT FOUND for ID: ${creds.userId}`);
            }
          }
        } else {
          console.log('❌ No credentials found for this email');
        }
      }
      
      console.log('─'.repeat(50));
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    mongoose.disconnect();
  }
}

testLogin(); 