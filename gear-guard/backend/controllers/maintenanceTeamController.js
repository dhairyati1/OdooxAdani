const MaintenanceTeam = require('../models/MaintenanceTeam');
const { createNotificationForManagers } = require('./notificationController');

/**
 * Maintenance Team Controller
 * 
 * Minimal endpoints for testing/hackathon purposes.
 * No auth middleware - for testing only.
 */

/**
 * Create new maintenance team
 * POST /api/maintenance-teams
 * 
 * Body: { name: "IT Support" }
 * 
 * Rules:
 * - Name required
 * - Unique team name
 */
const createMaintenanceTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    // Create maintenance team
    const maintenanceTeam = new MaintenanceTeam({
      name: name.trim(),
      description: description || undefined
    });

    await maintenanceTeam.save();

    // Create notification for managers
    await createNotificationForManagers({
      message: `New maintenance team "${name.trim()}" has been created`,
      type: 'team_created',
      relatedId: maintenanceTeam._id,
      metadata: {
        teamName: name.trim()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance team created successfully',
      data: maintenanceTeam
    });

  } catch (error) {
    // Handle duplicate key errors (unique name)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Team name already exists'
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next(error);
  }
};

/**
 * Get all maintenance teams
 * GET /api/maintenance-teams
 * 
 * Returns all active maintenance teams
 */
const getMaintenanceTeams = async (req, res, next) => {
  try {
    const teams = await MaintenanceTeam.find({ isActive: true })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: teams
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMaintenanceTeam,
  getMaintenanceTeams
};

