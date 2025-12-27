const express = require('express');
const router = express.Router();
const { createMaintenanceTeam, getMaintenanceTeams } = require('../controllers/maintenanceTeamController');

/**
 * Maintenance Team Routes
 * 
 * Minimal endpoints for testing/hackathon purposes.
 * No auth middleware - for testing only.
 */

// GET /api/maintenance-teams - Get all maintenance teams
router.get('/', getMaintenanceTeams);

// POST /api/maintenance-teams - Create new maintenance team
router.post('/', createMaintenanceTeam);

module.exports = router;

