require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

/**
 * Server Bootstrap
 * 
 * This is the entry point for the GearGuard backend server.
 * 
 * Responsibilities:
 * - Load environment variables
 * - Connect to MongoDB
 * - Start Express server
 * - Handle graceful shutdown
 * 
 * Usage:
 *   node backend/server.js
 *   or
 *   npm start (if script is configured)
 */

const PORT = process.env.PORT || 5000;

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB first
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 GearGuard Server Running`);
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health Check: http://localhost:${PORT}/api/health\n`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        
        // Close MongoDB connection
        const mongoose = require('mongoose');
        mongoose.connection.close(false, () => {
          console.log('✅ MongoDB connection closed');
          process.exit(0);
        });
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

