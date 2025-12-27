const MaintenanceRequest = require('../models/MaintenanceRequest');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const {
  createNotification,
  createNotificationsForTeam,
  createNotificationForManagers
} = require('./notificationController');

/**
 * Maintenance Request Controller
 * 
 * Handles all maintenance request-related business logic.
 * Includes creation, assignment, and status transitions.
 */

/**
 * Get all maintenance requests
 * GET /api/maintenance-requests
 * 
 * Role-based filtering:
 * - User: Only requests created by that user
 * - Technician: Only requests from their maintenance team
 * - Manager: All requests
 */
const getMaintenanceRequests = async (req, res, next) => {
  try {
    const { id: userId, role, team } = req.user;
    
    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Build query based on role
    let query = { isActive: true };

    if (role === 'user') {
      // Users see only their own requests
      query.createdBy = userId;
    } else if (role === 'technician') {
      // Technicians see only requests from their team
      if (!team) {
        return res.status(403).json({
          success: false,
          message: 'Technician must belong to a maintenance team'
        });
      }
      query.maintenanceTeam = team;
    }
    // Managers see all requests (no additional filter)

    const requests = await MaintenanceRequest.find(query)
      .populate('equipment', 'name category department')
      .populate('maintenanceTeam', 'name')
      .populate('assignedTechnician', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new maintenance request
 * POST /api/maintenance-requests
 * 
 * Business Rules:
 * - Any authenticated user can create Corrective requests
 * - Only managers can create Preventive requests
 * - Equipment selection auto-fills maintenance team
 * - Default status is "New"
 * - Cannot create request for scrapped equipment
 */
const createMaintenanceRequest = async (req, res, next) => {
  try {
    // TODO: Add auth middleware to verify req.user exists
    
    const { id: userId, role } = req.user || {};
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const {
      type,
      title,
      description,
      equipment,
      scheduledDate, // Required for Preventive requests
      equipmentId // Alternative field name for equipment
    } = req.body;

    // Validate required fields
    if (!type || !title || !equipment && !equipmentId) {
      return res.status(400).json({
        success: false,
        message: 'Type, title, and equipment are required'
      });
    }

    // Permission check: Only managers can create Preventive requests
    if (type === 'Preventive' && role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Only managers can create Preventive maintenance requests'
      });
    }

    // Validate type
    if (!['Corrective', 'Preventive'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either Corrective or Preventive'
      });
    }

    // Validate scheduledDate for Preventive requests
    if (type === 'Preventive' && !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date is required for Preventive maintenance requests'
      });
    }

    // Get equipment
    const equipmentIdToUse = equipment || equipmentId;
    const equipmentDoc = await Equipment.findById(equipmentIdToUse);

    if (!equipmentDoc || !equipmentDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive equipment'
      });
    }

    // Prevent request creation if equipment is scrapped
    if (equipmentDoc.isScrapped) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create request for scrapped equipment'
      });
    }

    // Auto-fill maintenance team from equipment
    const maintenanceTeam = equipmentDoc.defaultMaintenanceTeam;

    if (!maintenanceTeam) {
      return res.status(400).json({
        success: false,
        message: 'Equipment must have a default maintenance team'
      });
    }

    // Create maintenance request
    const maintenanceRequest = new MaintenanceRequest({
      type,
      title,
      description,
      equipment: equipmentIdToUse,
      maintenanceTeam, // Auto-filled from equipment
      scheduledDate: type === 'Preventive' ? scheduledDate : undefined,
      createdBy: userId,
      status: 'New' // Default status
    });

    await maintenanceRequest.save();

    // Populate related fields for response
    await maintenanceRequest.populate('equipment', 'name category department');
    await maintenanceRequest.populate('maintenanceTeam', 'name');
    await maintenanceRequest.populate('createdBy', 'firstName lastName email');

    // Create notifications
    // 1. Notify the user who created the request
    await createNotification({
      userId: userId,
      role: role,
      message: `Your maintenance request "${title}" has been created successfully`,
      type: 'request_created',
      relatedId: maintenanceRequest._id,
      metadata: {
        requestTitle: title,
        equipmentName: equipmentDoc.name
      }
    });

    // 2. Notify all technicians in the maintenance team
    await createNotificationsForTeam(
      maintenanceTeam,
      {
        message: `New maintenance request "${title}" assigned to your team`,
        type: 'request_created',
        relatedId: maintenanceRequest._id,
        metadata: {
          requestTitle: title,
          equipmentName: equipmentDoc.name
        }
      }
    );

    // 3. Notify managers
    await createNotificationForManagers({
      message: `New maintenance request "${title}" created`,
      type: 'request_created',
      relatedId: maintenanceRequest._id,
      metadata: {
        requestTitle: title,
        equipmentName: equipmentDoc.name,
        createdBy: userId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance request created successfully',
      data: maintenanceRequest
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

    next(error);
  }
};

/**
 * Assign technician to maintenance request
 * PATCH /api/maintenance-requests/:id/assign
 * 
 * Business Rules:
 * - Technician must belong to the request's maintenance team
 * - Technician must be active
 * - Reassignment allowed only by managers while status is "In Progress"
 */
const assignTechnician = async (req, res, next) => {
  try {
    const { id: userId, role, team: userTeam } = req.user;
    
    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { id } = req.params;
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        success: false,
        message: 'Technician ID is required'
      });
    }

    // Find maintenance request
    const maintenanceRequest = await MaintenanceRequest.findById(id);

    if (!maintenanceRequest || !maintenanceRequest.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }

    // Reassignment rule: Only managers can reassign when status is "In Progress"
    if (maintenanceRequest.assignedTechnician && maintenanceRequest.status === 'In Progress') {
      if (role !== 'manager') {
        return res.status(403).json({
          success: false,
          message: 'Only managers can reassign technicians when request is In Progress'
        });
      }
    }

    // Find technician
    const technician = await User.findById(technicianId);

    if (!technician || !technician.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive technician'
      });
    }

    // Validate technician role
    if (technician.role !== 'technician') {
      return res.status(400).json({
        success: false,
        message: 'User must be a technician'
      });
    }

    // Validate technician belongs to request's maintenance team
    const technicianTeamId = technician.maintenanceTeam?.toString();
    const requestTeamId = maintenanceRequest.maintenanceTeam?.toString();

    if (technicianTeamId !== requestTeamId) {
      return res.status(403).json({
        success: false,
        message: 'Technician must belong to the request\'s maintenance team'
      });
    }

    // Assign technician
    maintenanceRequest.assignedTechnician = technicianId;
    await maintenanceRequest.save();

    // Populate related fields for response
    await maintenanceRequest.populate('assignedTechnician', 'firstName lastName email');
    await maintenanceRequest.populate('equipment', 'name');
    await maintenanceRequest.populate('maintenanceTeam', 'name');

    // Create notification for assigned technician
    await createNotification({
      userId: technicianId,
      role: 'technician',
      message: `You have been assigned to maintenance request "${maintenanceRequest.title}"`,
      type: 'request_assigned',
      relatedId: maintenanceRequest._id,
      metadata: {
        requestTitle: maintenanceRequest.title,
        equipmentName: maintenanceRequest.equipment?.name || 'Unknown'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Technician assigned successfully',
      data: maintenanceRequest
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update maintenance request status
 * PATCH /api/maintenance-requests/:id/status
 * 
 * Business Rules:
 * - Status flow: New → In Progress → Repaired → Scrap (strictly linear)
 * - Direct New → Scrap is NOT allowed
 * - Assigned technician required for In Progress
 * - Duration required for Repaired
 * - Only managers can move to Scrap
 * - Repaired is final (cannot be reopened)
 */
const updateStatus = async (req, res, next) => {
  try {
    // TODO: Add auth middleware to verify req.user exists
    
    const { id: userId, role } = req.user || {};
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { id } = req.params;
    const { status, duration } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status value
    const validStatuses = ['New', 'In Progress', 'Repaired', 'Scrap'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find maintenance request
    const maintenanceRequest = await MaintenanceRequest.findById(id);

    if (!maintenanceRequest || !maintenanceRequest.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }

    const currentStatus = maintenanceRequest.status;

    // Prevent reopening Repaired requests
    if (currentStatus === 'Repaired' && status !== 'Repaired') {
      return res.status(400).json({
        success: false,
        message: 'Repaired requests cannot be reopened'
      });
    }

    // Prevent direct New → Scrap transition
    if (currentStatus === 'New' && status === 'Scrap') {
      return res.status(400).json({
        success: false,
        message: 'Cannot move directly from New to Scrap. Must go through In Progress first.'
      });
    }

    // Permission check: Only managers can move to Scrap
    if (status === 'Scrap' && role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Only managers can move requests to Scrap'
      });
    }

    // Validate status transitions (strictly linear)
    const validTransitions = {
      'New': ['In Progress'],
      'In Progress': ['Repaired', 'Scrap'],
      'Repaired': [], // Final state
      'Scrap': [] // Final state
    };

    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${status}`
      });
    }

    // Validate assigned technician for In Progress
    if (status === 'In Progress' && !maintenanceRequest.assignedTechnician) {
      return res.status(400).json({
        success: false,
        message: 'Assigned technician is required before moving to In Progress'
      });
    }

    // Validate duration for Repaired
    if (status === 'Repaired') {
      const durationToUse = duration !== undefined ? duration : maintenanceRequest.duration;
      
      if (!durationToUse || durationToUse <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Duration is required before moving to Repaired status'
        });
      }

      // Update duration if provided
      if (duration !== undefined) {
        // Permission check: Only assigned technician or manager can edit duration
        const isAssignedTechnician = maintenanceRequest.assignedTechnician?.toString() === userId;
        if (!isAssignedTechnician && role !== 'manager') {
          return res.status(403).json({
            success: false,
            message: 'Only the assigned technician or a manager can edit duration'
          });
        }
        maintenanceRequest.duration = duration;
      }
    }

    // Update status
    maintenanceRequest.status = status;
    await maintenanceRequest.save();

    // Populate related fields for response
    await maintenanceRequest.populate('equipment', 'name category');
    await maintenanceRequest.populate('maintenanceTeam', 'name');
    await maintenanceRequest.populate('assignedTechnician', 'firstName lastName');
    await maintenanceRequest.populate('createdBy', 'firstName lastName');

    // Create notifications based on status change
    const statusMessages = {
      'In Progress': 'has been moved to In Progress',
      'Repaired': 'has been marked as Repaired',
      'Scrap': 'has been marked as Scrap'
    };

    const statusMessage = statusMessages[status] || 'status has been updated';

    // 1. Notify the user who created the request
    if (maintenanceRequest.createdBy) {
      await createNotification({
        userId: maintenanceRequest.createdBy._id || maintenanceRequest.createdBy,
        role: 'user',
        message: `Your maintenance request "${maintenanceRequest.title}" ${statusMessage}`,
        type: 'request_status_changed',
        relatedId: maintenanceRequest._id,
        metadata: {
          requestTitle: maintenanceRequest.title,
          oldStatus: currentStatus,
          newStatus: status
        }
      });
    }

    // 2. Notify assigned technician (if any)
    if (maintenanceRequest.assignedTechnician) {
      const techId = maintenanceRequest.assignedTechnician._id || maintenanceRequest.assignedTechnician;
      await createNotification({
        userId: techId,
        role: 'technician',
        message: `Maintenance request "${maintenanceRequest.title}" ${statusMessage}`,
        type: 'request_status_changed',
        relatedId: maintenanceRequest._id,
        metadata: {
          requestTitle: maintenanceRequest.title,
          oldStatus: currentStatus,
          newStatus: status
        }
      });
    }

    // 3. Notify managers for important status changes (Repaired, Scrap)
    if (status === 'Repaired' || status === 'Scrap') {
      await createNotificationForManagers({
        message: `Maintenance request "${maintenanceRequest.title}" ${statusMessage}`,
        type: 'request_status_changed',
        relatedId: maintenanceRequest._id,
        metadata: {
          requestTitle: maintenanceRequest.title,
          oldStatus: currentStatus,
          newStatus: status
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: maintenanceRequest
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

    next(error);
  }
};

/**
 * Get autofill data for equipment
 * GET /api/maintenance-requests/autofill/:equipmentId
 * 
 * Returns equipment name, maintenance team, and location (department or employee)
 * Used by frontend to auto-fill form fields when equipment is selected
 */
const getAutofillData = async (req, res, next) => {
  try {
    const { equipmentId } = req.params;

    if (!equipmentId) {
      return res.status(400).json({
        success: false,
        message: 'Equipment ID is required'
      });
    }

    // Find equipment with populated maintenance team
    const equipment = await Equipment.findById(equipmentId)
      .populate('defaultMaintenanceTeam', 'name')
      .populate('employee', 'firstName lastName email');

    if (!equipment || !equipment.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Build location string (department or employee name)
    let location = null;
    if (equipment.department) {
      location = equipment.department;
    } else if (equipment.employee) {
      location = `${equipment.employee.firstName} ${equipment.employee.lastName}`;
    }

    // Return autofill data
    res.status(200).json({
      success: true,
      data: {
        equipmentName: equipment.name,
        maintenanceTeam: {
          id: equipment.defaultMaintenanceTeam._id,
          name: equipment.defaultMaintenanceTeam.name
        },
        location,
        department: equipment.department || null,
        employee: equipment.employee ? {
          id: equipment.employee._id,
          name: `${equipment.employee.firstName} ${equipment.employee.lastName}`
        } : null
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaintenanceRequests,
  createMaintenanceRequest,
  assignTechnician,
  updateStatus,
  getAutofillData
};

