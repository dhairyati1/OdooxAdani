const express = require('express');
const router = express.Router();
const {
  getMaintenanceRequests,
  createMaintenanceRequest,
  assignTechnician,
  updateStatus
} = require('../controllers/maintenanceRequestController');

/**
 * Maintenance Request Routes
 * 
 * All maintenance request-related endpoints
 */

// GET /api/maintenance-requests
// Get all maintenance requests
// TODO: Add auth middleware to verify authentication
router.get('/', getMaintenanceRequests);

// GET /api/maintenance-requests/autofill/:equipmentId
// Get autofill data for equipment (name, team, location)
// Public endpoint (no auth required for form autofill)
// Note: This route is handled before auth middleware in app.js

// POST /api/maintenance-requests
// Create new maintenance request
// TODO: Add auth middleware to verify authentication
router.post('/', createMaintenanceRequest);

// PATCH /api/maintenance-requests/:id/assign
// Assign technician to maintenance request
// TODO: Add auth middleware to verify authentication
router.patch('/:id/assign', assignTechnician);

// PATCH /api/maintenance-requests/:id/status
// Update maintenance request status
// TODO: Add auth middleware to verify authentication
router.patch('/:id/status', updateStatus);

module.exports = router;

