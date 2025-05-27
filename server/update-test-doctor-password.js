const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Credentials = require('./src/models/Credentials');

async function updateTestDoctorPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/eventuraa');
    const hashedPassword = await bcrypt.hash('TempPassword123!', 10);
    await Credentials.updateOne(
      { email: 'test.doctor@eventuraa.com' },
      { password: hashedPassword }
    );
    console.log('✅ Updated test.doctor@eventuraa.com password');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

updateTestDoctorPassword(); 