const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Credentials = require('./src/models/Credentials');
const User = require('./src/models/User');
const Doctor = require('./src/models/Doctor');
const Organizer = require('./src/models/Organizer');
const VenueHost = require('./src/models/VenueHost');
const Admin = require('./src/models/Admin');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa';

async function fixDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully\n');
    
    console.log('🔍 Analyzing database issues...\n');
    
    // Get all credentials
    const allCredentials = await Credentials.find({});
    console.log(`Found ${allCredentials.length} credentials records`);
    
    let fixedCount = 0;
    let issuesFound = 0;
    
    for (const cred of allCredentials) {
      console.log(`\n--- Checking ${cred.email} (${cred.userType}) ---`);
      
      // Determine the model to check
      let userModel;
      switch (cred.userType) {
        case 'user':
          userModel = User;
          break;
        case 'doctor':
          userModel = User; // Doctors now reference User model
          break;
        case 'organizer':
          userModel = Organizer;
          break;
        case 'venue-host':
          userModel = VenueHost;
          break;
        case 'admin':
          userModel = Admin;
          break;
        default:
          console.log(`❌ Unknown user type: ${cred.userType}`);
          issuesFound++;
          continue;
      }
      
      // Check if the referenced user exists
      const user = await userModel.findById(cred.userId);
      
      if (!user) {
        console.log(`❌ User document missing for ID: ${cred.userId}`);
        issuesFound++;
        
        // Create missing user document
        try {
          const hashedPassword = await bcrypt.hash('TempPassword123!', 10);
          
          let newUser;
          switch (cred.userType) {
            case 'user':
              newUser = await User.create({
                _id: cred.userId,
                name: cred.email.split('@')[0], // Use email prefix as name
                email: cred.email,
                phone: cred.phone || '',
                password: hashedPassword,
                isActive: true,
                isVerified: true,
                role: 'user'
              });
              break;
              
            case 'doctor':
              newUser = await User.create({
                _id: cred.userId,
                name: `Dr. ${cred.email.split('@')[0]}`, // Use email prefix as name
                email: cred.email,
                phone: cred.phone || '',
                password: hashedPassword,
                isActive: true,
                isVerified: true,
                role: 'doctor'
              });
              break;
              
            case 'organizer':
              newUser = await Organizer.create({
                _id: cred.userId,
                name: cred.email.split('@')[0],
                email: cred.email,
                phone: cred.phone || '',
                companyName: `${cred.email.split('@')[0]} Company`,
                businessType: 'Event Management',
                isActive: true,
                isVerified: true
              });
              break;
              
            case 'venue-host':
              newUser = await VenueHost.create({
                _id: cred.userId,
                name: cred.email.split('@')[0],
                email: cred.email,
                phone: cred.phone || '',
                venueName: `${cred.email.split('@')[0]} Venue`,
                venueType: 'Conference Hall',
                venueLocation: 'Colombo, Sri Lanka',
                isActive: true,
                isVerified: true
              });
              break;
          }
          
          console.log(`✅ Created missing ${cred.userType} document for ${cred.email}`);
          fixedCount++;
          
        } catch (error) {
          console.log(`❌ Failed to create user document: ${error.message}`);
        }
      } else {
        console.log(`✅ User document exists: ${user.name} (${user.email})`);
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Issues found: ${issuesFound}`);
    console.log(`Issues fixed: ${fixedCount}`);
    
    if (fixedCount > 0) {
      console.log('\n📝 Note: All created users have temporary password: TempPassword123!');
      console.log('   Users should be advised to change their passwords.');
    }
    
    // Now let's test a few logins to see if they work
    console.log('\n🧪 Testing fixed logins...');
    
    const authService = require('./src/services/authService');
    
    const testUsers = [
      { email: 'john@example.com', password: 'TempPassword123!', userType: 'user' },
      { email: 'ashan@gmail.com', password: 'TempPassword123!', userType: 'organizer' }
    ];
    
    for (const testUser of testUsers) {
      try {
        const result = await authService.login(testUser.email, testUser.password, testUser.userType);
        console.log(`✅ ${testUser.email} login test: SUCCESS`);
      } catch (error) {
        console.log(`❌ ${testUser.email} login test: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error in fix script:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixDatabase(); 