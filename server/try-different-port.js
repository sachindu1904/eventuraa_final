// This script tries connecting to MongoDB on various common ports
require('dotenv').config();
const { MongoClient } = require('mongodb');

// Array of common MongoDB ports to try
const portsToTry = [27017, 27018, 27019];

async function testConnection(port) {
  const uri = `mongodb://localhost:${port}/eventuraa`;
  console.log(`Trying connection on port ${port}: ${uri}`);
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  });
  
  try {
    await client.connect();
    console.log(`✅ Successfully connected on port ${port}`);
    
    // Try to insert a test document
    const database = client.db();
    const collection = database.collection('port_test');
    
    const result = await collection.insertOne({
      testPort: port,
      timestamp: new Date()
    });
    
    console.log(`✅ Successfully inserted document on port ${port}:`, result);
    return true;
  } catch (error) {
    console.log(`❌ Failed to connect on port ${port}: ${error.message}`);
    return false;
  } finally {
    await client.close();
  }
}

async function main() {
  console.log('Testing various MongoDB port connections...');
  
  for (const port of portsToTry) {
    const success = await testConnection(port);
    if (success) {
      console.log(`\nFOUND WORKING CONNECTION ON PORT ${port}`);
      console.log(`Use this connection string in your .env file:`);
      console.log(`MONGO_URI=mongodb://localhost:${port}/eventuraa`);
      break;
    }
  }
}

main().catch(console.error); 