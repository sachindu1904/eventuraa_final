require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Doctor = require('./src/models/Doctor');
const Organizer = require('./src/models/Organizer');
const Credentials = require('./src/models/Credentials');

console.log('Starting database initialization...');

async function initDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB Connected.');
    
    // Get database and drop all collections to start fresh (BE CAREFUL WITH THIS!)
    const db = mongoose.connection.db;
    console.log('Connected to database:', db.databaseName);

    console.log('Creating test data to initialize collections...');
    
    // Create a test user
    try {
      const user = new User({
        name: 'Test User Init',
        email: 'init-test-user@example.com',
        phone: '+94 76 123 0000'
      });
      await user.save();
      console.log('User collection initialized with test document:', user._id);
    } catch (error) {
      console.error('Failed to initialize User collection:', error.message);
    }
    
    // Create a test doctor
    try {
      const doctor = new Doctor({
        name: 'Dr. Test Init',
        email: 'init-test-doctor@example.com',
        phone: '+94 76 123 0001',
        regNumber: 'SLMC-TEST-001',
        specialty: 'General Medicine'
      });
      await doctor.save();
      console.log('Doctor collection initialized with test document:', doctor._id);
    } catch (error) {
      console.error('Failed to initialize Doctor collection:', error.message);
    }
    
    // Create a test organizer
    try {
      const organizer = new Organizer({
        name: 'Test Organizer Init',
        companyName: 'Test Events Co.',
        email: 'init-test-organizer@example.com',
        phone: '+94 76 123 0002',
        businessType: 'Event Management'
      });
      await organizer.save();
      console.log('Organizer collection initialized with test document:', organizer._id);
    } catch (error) {
      console.error('Failed to initialize Organizer collection:', error.message);
    }
    
    // Create test credentials for each user type
    try {
      // We need existing users for these credentials since userId is required
      const [existingUser] = await User.find().limit(1);
      const [existingDoctor] = await Doctor.find().limit(1);
      const [existingOrganizer] = await Organizer.find().limit(1);
      
      if (existingUser) {
        const userCredentials = new Credentials({
          email: existingUser.email,
          password: 'password123',
          userType: 'user',
          userId: existingUser._id,
          userModel: 'User'
        });
        await userCredentials.save();
        console.log('User Credentials created:', userCredentials._id);
      }
      
      if (existingDoctor) {
        const doctorCredentials = new Credentials({
          email: existingDoctor.email,
          password: 'password123',
          userType: 'doctor',
          userId: existingDoctor._id,
          userModel: 'Doctor'
        });
        await doctorCredentials.save();
        console.log('Doctor Credentials created:', doctorCredentials._id);
      }
      
      if (existingOrganizer) {
        const organizerCredentials = new Credentials({
          email: existingOrganizer.email,
          password: 'password123',
          userType: 'organizer',
          userId: existingOrganizer._id,
          userModel: 'Organizer'
        });
        await organizerCredentials.save();
        console.log('Organizer Credentials created:', organizerCredentials._id);
      }
      
      console.log('Credentials collection initialized.');
    } catch (error) {
      console.error('Failed to initialize Credentials collection:', error.message);
    }
    
    // List all collections to verify they were created
    console.log('Listing all collections in the database:');
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    console.log('Database initialization completed successfully!');
    console.log('Please check MongoDB Compass to verify the collections are visible.');
    console.log('Connect to: mongodb://localhost:27017/ in MongoDB Compass');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  }
}

// Run the initialization
initDatabase(); 