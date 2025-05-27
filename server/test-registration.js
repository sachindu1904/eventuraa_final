const mongoose = require('mongoose');
const authService = require('./src/services/authService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa';

async function testRegistration() {
  try {
    console.log('🧪 TESTING USER REGISTRATION\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully\n');
    
    // Test user registration with the same data from the error
    const testUserData = {
      name: "test1",
      email: "test1u@gmail.com",
      phone: "0703486673",
      password: "Test1u123$",
      userType: "user"
    };
    
    console.log('Testing user registration with data:');
    console.log(JSON.stringify(testUserData, null, 2));
    console.log('\n=== REGISTRATION TEST ===');
    
    try {
      const result = await authService.register(testUserData, testUserData.userType);
      
      console.log('✅ REGISTRATION SUCCESS!');
      console.log(`User ID: ${result.user._id}`);
      console.log(`User Name: ${result.user.name}`);
      console.log(`User Email: ${result.user.email}`);
      console.log(`Credentials ID: ${result.credentials._id}`);
      console.log(`Token generated: ${result.token ? 'Yes' : 'No'}`);
      
      // Test immediate login
      console.log('\n=== LOGIN TEST ===');
      const loginResult = await authService.login(
        testUserData.email,
        testUserData.password,
        testUserData.userType
      );
      
      console.log('✅ LOGIN SUCCESS!');
      console.log(`Logged in as: ${loginResult.user.name}`);
      
    } catch (error) {
      console.log('❌ REGISTRATION/LOGIN FAILED!');
      console.log(`Error: ${error.message}`);
      console.log(`Stack: ${error.stack}`);
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    mongoose.disconnect();
  }
}

testRegistration(); 