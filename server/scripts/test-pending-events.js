require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Event = require('../src/models/Event');

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa';

async function testPendingEvents() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');

    // Check if the Event model has an approvalStatus field
    const eventSchema = Event.schema;
    console.log('Event schema has approvalStatus:', eventSchema.paths.hasOwnProperty('approvalStatus'));
    if (eventSchema.paths.approvalStatus) {
      console.log('approvalStatus type:', eventSchema.paths.approvalStatus.instance);
      console.log('approvalStatus enum values:', eventSchema.paths.approvalStatus.enumValues);
      console.log('approvalStatus default:', eventSchema.paths.approvalStatus.defaultValue);
    }

    // Try to find pending events
    console.log('\nSearching for pending events...');
    const pendingEvents = await Event.find({ approvalStatus: 'pending' });
    console.log(`Found ${pendingEvents.length} pending events`);

    if (pendingEvents.length > 0) {
      // Just show some basic info about the first event
      console.log('\nFirst pending event details:');
      console.log('- ID:', pendingEvents[0]._id);
      console.log('- Title:', pendingEvents[0].title);
      console.log('- Organizer:', pendingEvents[0].organizer);
      console.log('- Approval Status:', pendingEvents[0].approvalStatus);
    } else {
      console.log('\nNo pending events found. Creating a test event...');
      
      // Create test event with pending approval
      const testEvent = await Event.create({
        title: 'Test Pending Event',
        description: 'This is a test event created for testing the approval process',
        date: new Date(Date.now() + 604800000), // One week from now
        time: '14:00',
        location: {
          name: 'Test Location',
          address: '123 Test St',
          city: 'Test City',
          district: 'Test District'
        },
        eventType: 'Conference',
        category: 'Technology',
        ticketPrice: 100,
        ticketsAvailable: 50,
        ticketTypes: [{
          name: 'General',
          price: 100,
          quantity: 50,
          available: 50
        }],
        approvalStatus: 'pending',
        organizer: '652a5d1b96e94ddae73f7b11' // Replace with an actual organizer ID from your database
      });

      console.log('\nCreated test pending event:');
      console.log('- ID:', testEvent._id);
      console.log('- Title:', testEvent.title);
      console.log('- Approval Status:', testEvent.approvalStatus);
    }

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  } catch (error) {
    console.error('Error testing pending events:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
  }
}

testPendingEvents(); 