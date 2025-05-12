require('dotenv').config();
const mongoose = require('mongoose');

// Define a simple test schema
const TestSchema = new mongoose.Schema({
  name: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a model
const Test = mongoose.model('Test', TestSchema);

// Function to connect to MongoDB and insert test data
async function testMongoConnection() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB:', process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB Connected Successfully');
    
    // Create test data
    console.log('Creating test document...');
    const testDoc = await Test.create({
      name: 'Test Document ' + new Date().toISOString()
    });
    
    console.log('Test document created successfully:', testDoc);
    
    // Find all test documents
    const allTests = await Test.find({});
    console.log('All test documents:', allTests);
    
    console.log('Test completed successfully. Check MongoDB Compass to see if the test data appears.');
  } catch (error) {
    console.error('MongoDB Test Error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
testMongoConnection(); 