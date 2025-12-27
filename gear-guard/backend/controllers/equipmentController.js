const Equipment = require('../models/Equipment');
const MaintenanceTeam = require('../models/MaintenanceTeam');
const { createNotificationForManagers } = require('./notificationController');

/**
 * Equipment Controller
 * 
 * Handles all equipment-related business logic.
 * Equipment creation is restricted to managers only.
 */

/**
 * Create new equipment
 * POST /api/equipment
 * 
 * Business Rules:
 * - Only managers can create equipment
 * - Equipment must belong to either department OR employee (mutually exclusive)
 * - Serial number must be unique if provided
 * - Default maintenance team must be valid and active
 */
const createEquipment = async (req, res, next) => {
  try {
    const { role } = req.user;
    
    // Permission check: Only managers can create equipment
    if (role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Only managers can create equipment'
      });
    }

    const {
      name,
      description,
      category,
      serialNumber,
      department,
      employee,
      defaultMaintenanceTeam
    } = req.body;

    // Validate required fields
    if (!name || !defaultMaintenanceTeam) {
      return res.status(400).json({
        success: false,
        message: 'Name and default maintenance team are required'
      });
    }

    // Validate department OR employee (mutually exclusive)
    if (!department && !employee) {
      return res.status(400).json({
        success: false,
        message: 'Equipment must belong to either a department or an employee'
      });
    }

    if (department && employee) {
      return res.status(400).json({
        success: false,
        message: 'Equipment cannot belong to both a department and an employee'
      });
    }

    // Validate default maintenance team exists and is active
    const team = await MaintenanceTeam.findById(defaultMaintenanceTeam);
    if (!team || !team.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive maintenance team'
      });
    }

    // Check for duplicate serial number if provided
    if (serialNumber) {
      const existingEquipment = await Equipment.findOne({ 
        serialNumber,
        isActive: true 
      });
      
      if (existingEquipment) {
        return res.status(400).json({
          success: false,
          message: 'Serial number already exists'
        });
      }
    }

    // Create equipment
    const equipment = new Equipment({
      name,
      description,
      category,
      serialNumber,
      department: department || undefined,
      employee: employee || undefined,
      defaultMaintenanceTeam
    });

    await equipment.save();

    // Populate related fields for response
    await equipment.populate('defaultMaintenanceTeam', 'name');
    if (equipment.employee) {
      await equipment.populate('employee', 'firstName lastName email');
    }

    // Create notification for managers
    await createNotificationForManagers({
      message: `New equipment "${name}" has been added`,
      type: 'equipment_created',
      relatedId: equipment._id,
      metadata: {
        equipmentName: name,
        category: category || null,
        teamName: team.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Equipment created successfully',
      data: equipment
    });

  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Handle duplicate key errors (e.g., duplicate serial number)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    next(error);
  }
};

/**
 * Get all equipment
 * GET /api/equipment
 * 
 * Returns all active equipment with populated fields
 */
const getEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.find({ isActive: true })
      .populate('defaultMaintenanceTeam', 'name')
      .populate('employee', 'firstName lastName email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEquipment,
  getEquipment
};

