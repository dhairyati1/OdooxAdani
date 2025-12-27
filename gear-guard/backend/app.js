const express = require('express');
const cors = require('cors');
const auth = require('./middleware/auth');

/**
 * Express Application Setup
 * 
 * This file configures the Express application with:
 * - JSON body parsing
 * - CORS middleware
 * - Health check route
 * - API route mounting (to be added later)
 * 
 * Note: This is the app configuration, not the server bootstrap.
 * Server bootstrap is handled in server.js
 */

const app = express();

// ============================================
// Middleware
// ============================================

// Enable CORS for frontend (will be added later)
// Allows requests from any origin - can be restricted later
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Auth routes (public - no auth required)
app.use('/api/auth', require('./routes/authRoutes'));

// Health check (public)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// Routes
// ============================================

// Protected API routes (require authentication)
// Teams: GET is public (for registration), POST requires auth
const { getMaintenanceTeams, createMaintenanceTeam } = require('./controllers/maintenanceTeamController');
app.get('/api/maintenance-teams', getMaintenanceTeams); // Public for registration
app.post('/api/maintenance-teams', auth, createMaintenanceTeam); // POST requires auth

app.use('/api/users', auth, require('./routes/userRoutes'));
app.use('/api/equipment', auth, require('./routes/equipmentRoutes'));

// Maintenance requests - autofill is public, others require auth
const { getAutofillData } = require('./controllers/maintenanceRequestController');
app.get('/api/maintenance-requests/autofill/:equipmentId', getAutofillData);
app.use('/api/maintenance-requests', auth, require('./routes/maintenanceRequestRoutes'));

// Notifications - all routes require auth
app.use('/api/notifications', auth, require('./routes/notificationRoutes'));

// ============================================
// Error Handling (Basic)
// ============================================

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler (basic - can be enhanced later)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;

