require('dotenv').config();
const mongoose = require('mongoose');
const authService = require('./src/services/authService');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventuraa')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const createTestDoctor = async () => {
  try {
    console.log('Creating test doctor...');
    
    const doctorData = {
      name: 'Dr. Test Doctor',
      email: 'test.doctor@eventuraa.com',
      password: 'password123',
      phone: '+94771234567',
      regNumber: 'TEST-12345',
      specialty: 'General Medicine',
      experience: 5,
      bio: 'Test doctor for authentication testing'
    };
    
    const result = await authService.register(doctorData, 'doctor');
    
    console.log('Test doctor created successfully!');
    console.log('Email:', doctorData.email);
    console.log('Password:', doctorData.password);
    console.log('Registration Number:', doctorData.regNumber);
    console.log('User ID:', result.user._id);
    console.log('Token:', result.token);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test doctor:', error);
    process.exit(1);
  }
};

createTestDoctor(); 