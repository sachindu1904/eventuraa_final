require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const organizerRoutes = require('./routes/organizerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const venueHostRoutes = require('./routes/venueHostRoutes');
const venueRoutes = require('./routes/venueRoutes');
const ticketPurchaseRoutes = require('./routes/ticketPurchaseRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const Event = require('./models/Event');

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Setup CORS with permissive options for development
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Add a manual OPTIONS handler for preflight requests
app.options('*', cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/venue-host', venueHostRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/tickets', ticketPurchaseRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Test route to insert data into MongoDB
app.get('/api/test-db', async (req, res) => {
  try {
    // Create a simple test schema if it doesn't exist already
    const testSchema = new mongoose.Schema({
      name: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    // If model already exists, mongoose will use that instead of creating a new one
    let TestModel;
    try {
      TestModel = mongoose.model('TestModel');
    } catch (error) {
      TestModel = mongoose.model('TestModel', testSchema);
    }
    
    // Insert a test document
    const testDoc = await TestModel.create({
      name: 'Test entry ' + new Date().toISOString()
    });
    
    // Find all test documents
    const allDocs = await TestModel.find().sort({ timestamp: -1 });
    
    res.status(200).json({
      success: true,
      message: 'Test document created successfully',
      testDoc,
      allDocs
    });
  } catch (error) {
    console.error('Test DB Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test document',
      error: error.message
    });
  }
});

// Route to check database collections and content
app.get('/api/check-db', async (req, res) => {
  try {
    console.log('[SERVER] Checking database collections and content');
    
    // Connection status
    const connectionState = mongoose.connection.readyState;
    const connectionStateText = connectionState === 0 ? 'disconnected' :
                               connectionState === 1 ? 'connected' : 
                               connectionState === 2 ? 'connecting' :
                               connectionState === 3 ? 'disconnecting' : 'unknown';
    
    console.log(`[SERVER] Database connection status: ${connectionStateText} (${connectionState})`);
    
    // Check if connection is ready
    if (connectionState !== 1) {
      throw new Error('MongoDB is not connected');
    }
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('[SERVER] Collections in database:', collectionNames);
    
    // Get counts of documents in each collection
    const collectionStats = {};
    
    for (const name of collectionNames) {
      const count = await mongoose.connection.db.collection(name).countDocuments();
      collectionStats[name] = count;
      console.log(`[SERVER] Collection '${name}' has ${count} documents`);
      
      // Get sample data for each collection
      if (count > 0) {
        const samples = await mongoose.connection.db.collection(name).find().limit(3).toArray();
        console.log(`[SERVER] Sample from '${name}':`, JSON.stringify(samples, null, 2));
      }
    }
    
    // Check our main models
    const modelNames = ['User', 'Doctor', 'Organizer', 'Credentials'];
    const modelStats = {};
    
    for (const name of modelNames) {
      try {
        if (mongoose.modelNames().includes(name)) {
          const model = mongoose.model(name);
          const count = await model.countDocuments();
          modelStats[name] = count;
          console.log(`[SERVER] Model '${name}' has ${count} documents`);
          
          // Get sample data for each model
          if (count > 0) {
            const samples = await model.find().limit(3).lean();
            console.log(`[SERVER] Sample from model '${name}':`, JSON.stringify(samples, null, 2));
          }
        } else {
          console.log(`[SERVER] Model '${name}' is not registered in Mongoose`);
          modelStats[name] = 'not registered';
        }
      } catch (err) {
        console.error(`[SERVER] Error checking model ${name}:`, err);
        modelStats[name] = `error: ${err.message}`;
      }
    }
    
    res.status(200).json({
      success: true,
      connection: {
        state: connectionState,
        stateText: connectionStateText
      },
      collections: collectionNames,
      documentCounts: collectionStats,
      modelStats: modelStats
    });
  } catch (error) {
    console.error('[SERVER] Database check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check database',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB:', process.env.MONGO_URI);
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Start the server
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  });
}

module.exports = app;  // Export for testing 