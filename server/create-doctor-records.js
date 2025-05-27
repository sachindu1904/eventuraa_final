const mongoose = require('mongoose');
const Credentials = require('./src/models/Credentials');
const User = require('./src/models/User');
const Doctor = require('./src/models/Doctor');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa';

async function createDoctorRecords() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully\n');
    
    console.log('🏥 Creating missing Doctor records...\n');
    
    // Find all doctor credentials
    const doctorCredentials = await Credentials.find({ userType: 'doctor' });
    console.log(`Found ${doctorCredentials.length} doctor credentials`);
    
    let createdCount = 0;
    
    for (const cred of doctorCredentials) {
      console.log(`\n--- Processing ${cred.email} ---`);
      
      // Check if User record exists
      const user = await User.findById(cred.userId);
      if (!user) {
        console.log(`❌ No User record found for ${cred.email}`);
        continue;
      }
      
      // Check if Doctor record already exists
      const existingDoctor = await Doctor.findOne({ email: cred.email });
      if (existingDoctor) {
        console.log(`✅ Doctor record already exists for ${cred.email}`);
        continue;
      }
      
      // Create Doctor record
      try {
        const doctorData = {
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          regNumber: getRegNumberForEmail(cred.email),
          specialty: 'General Medicine',
          qualifications: [
            { degree: 'MBBS', institution: 'University of Colombo', year: 2010 }
          ],
          experience: 5,
          bio: `Experienced doctor specializing in general medicine.`,
          specializations: ['General Medicine'],
          languages: ['English', 'Sinhala'],
          practices: [
            {
              hospitalName: 'General Hospital',
              address: {
                street: 'Main Street',
                city: 'Colombo',
                district: 'Colombo',
                postalCode: '00100',
                country: 'Sri Lanka'
              },
              position: 'Consultant',
              contactNumber: '0112345678',
              workingHours: [
                { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
                { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
                { day: 'Friday', startTime: '09:00', endTime: '12:00', isAvailable: true }
              ]
            }
          ],
          consultationFee: {
            amount: 2000,
            currency: 'LKR'
          },
          isActive: true,
          verificationStatus: {
            isVerified: true,
            verificationDate: new Date()
          }
        };
        
        const doctor = await Doctor.create(doctorData);
        console.log(`✅ Created Doctor record for ${cred.email} with regNumber: ${doctorData.regNumber}`);
        createdCount++;
        
      } catch (error) {
        console.log(`❌ Failed to create Doctor record for ${cred.email}: ${error.message}`);
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Doctor records created: ${createdCount}`);
    
    // Test doctor login
    console.log('\n🧪 Testing doctor logins...');
    
    const authService = require('./src/services/authService');
    
    const testDoctors = [
      { email: 'sarah@doctor.com', password: 'TempPassword123!', userType: 'doctor', regNumber: 'SL-MED-1234' },
      { email: 'test.doctor@eventuraa.com', password: 'TempPassword123!', userType: 'doctor', regNumber: 'TEST-12345' }
    ];
    
    for (const testDoctor of testDoctors) {
      try {
        const result = await authService.login(
          testDoctor.email, 
          testDoctor.password, 
          testDoctor.userType,
          testDoctor.regNumber
        );
        console.log(`✅ ${testDoctor.email} doctor login: SUCCESS`);
      } catch (error) {
        console.log(`❌ ${testDoctor.email} doctor login: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error in create doctor records script:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Helper function to generate registration numbers
function getRegNumberForEmail(email) {
  const emailMap = {
    'sarah@doctor.com': 'SL-MED-1234',
    'test.doctor@eventuraa.com': 'TEST-12345',
    'chatura@gmail.com': 'SL-MED-2345',
    'testdoctor@eventuraa.lk': 'SL-MED-3456',
    'isuru@gmail.com': 'SL-MED-4567',
    'nimal.test3@gmail.com': 'SL-MED-5678',
    'nimal.new@gmail.com': 'SL-MED-6789',
    'test@gamil.com': 'SL-MED-7890',
    'doc1@gmail.com': 'SL-MED-8901'
  };
  
  return emailMap[email] || `SL-MED-${Math.floor(Math.random() * 10000)}`;
}

createDoctorRecords(); 