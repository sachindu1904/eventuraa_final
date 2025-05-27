const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Credentials = require('./src/models/Credentials');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa';

async function syncPasswords() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully\n');
    
    console.log('🔄 Syncing passwords for newly created users...\n');
    
    // List of users that were just created and need password sync
    const usersToSync = [
      'john@example.com',
      'jane@example.com', 
      'sarah@doctor.com',
      'chatura@gmail.com',
      'testdoctor@eventuraa.lk',
      'isuru@gmail.com',
      'isuru2@gmail.com',
      'nimal.test3@gmail.com',
      'nimal.new@gmail.com',
      'test@gamil.com',
      'doc1@gmail.com'
    ];
    
    const tempPassword = 'TempPassword123!';
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);
    
    let updatedCount = 0;
    
    for (const email of usersToSync) {
      try {
        // Update the credentials password
        const result = await Credentials.updateOne(
          { email: email.toLowerCase().trim() },
          { password: hashedTempPassword }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`✅ Updated password for ${email}`);
          updatedCount++;
        } else {
          console.log(`⚠️  No credentials found for ${email}`);
        }
      } catch (error) {
        console.log(`❌ Failed to update password for ${email}: ${error.message}`);
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Passwords updated: ${updatedCount}`);
    console.log(`Temporary password: ${tempPassword}`);
    
    // Test a few logins
    console.log('\n🧪 Testing updated logins...');
    
    const authService = require('./src/services/authService');
    
    const testUsers = [
      { email: 'john@example.com', password: tempPassword, userType: 'user' },
      { email: 'sarah@doctor.com', password: tempPassword, userType: 'doctor', regNumber: 'SL-MED-1234' },
      { email: 'admin@eventuraa.lk', password: 'Admin123!', userType: 'admin' }
    ];
    
    for (const testUser of testUsers) {
      try {
        const result = await authService.login(
          testUser.email, 
          testUser.password, 
          testUser.userType,
          testUser.regNumber
        );
        console.log(`✅ ${testUser.email} (${testUser.userType}) login: SUCCESS`);
      } catch (error) {
        console.log(`❌ ${testUser.email} (${testUser.userType}) login: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error in sync script:', error);
  } finally {
    mongoose.disconnect();
  }
}

syncPasswords(); 