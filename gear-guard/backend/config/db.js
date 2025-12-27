const mongoose = require('mongoose');

/**
 * MongoDB Database Connection Configuration
 * 
 * Handles connection to MongoDB using Mongoose.
 * Connection URI is read from environment variables.
 * 
 * Features:
 * - Automatic reconnection on failure
 * - Connection state logging
 * - Error handling
 */
const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Connection options for production-ready setup
    const options = {
      // Use new URL parser and unified topology (default in Mongoose 6+)
      // These options are handled automatically in Mongoose 8+
    };

    // Establish connection
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Log connection state
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // Exit process with failure code
    process.exit(1);
  }
};

module.exports = connectDB;

