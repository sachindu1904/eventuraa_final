// This script tests MongoDB connection using the official MongoDB driver
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  // Connection URI
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa';
  console.log('Connecting to MongoDB:', uri);

  // Create a new MongoClient
  const client = new MongoClient(uri);

  try {
    // Connect the client to the server
    await client.connect();
    console.log('Connected successfully to MongoDB server');

    // Get the database
    const database = client.db();
    console.log('Using database:', database.databaseName);

    // Access a collection
    const collection = database.collection('test_collection');

    // Insert a document
    const insertResult = await collection.insertOne({
      name: 'Direct Test',
      created: new Date()
    });
    console.log('Inserted document:', insertResult);

    // Find documents
    const findResult = await collection.find({}).toArray();
    console.log('Found documents:', findResult);

    console.log('MongoDB test successful. Check MongoDB Compass for the test_collection!');

  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log('MongoDB connection closed');
  }
}

main().catch(console.error); 