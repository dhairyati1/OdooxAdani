const User = require('../models/User');
const MaintenanceTeam = require('../models/MaintenanceTeam');
const bcrypt = require('bcryptjs');

/**
 * User Controller
 * 
 * Minimal endpoints for testing/hackathon purposes.
 * No auth middleware or password handling - for testing only.
 */

/**
 * Create new user
 * POST /api/users
 * 
 * Body: {
 *   "name": "Alex Tech",
 *   "role": "technician",   // or "manager"
 *   "team": "<maintenanceTeamId>"
 * }
 * 
 * Rules:
 * - role enum: manager | technician
 * - technician must belong to a team
 * - manager may have no team
 * 
 * Note: For testing, we auto-generate email and password
 */
const createUser = async (req, res, next) => {
  try {
    const { name, role, team } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    // Validate role enum
    const validRoles = ['user', 'technician', 'manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${validRoles.join(', ')}`
      });
    }

    // Split name into firstName and lastName
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'Name';

    // Validate team for technicians
    if (role === 'technician' && !team) {
      return res.status(400).json({
        success: false,
        message: 'Technicians must belong to a maintenance team'
      });
    }

    // Validate team exists if provided
    if (team) {
      const maintenanceTeam = await MaintenanceTeam.findById(team);
      if (!maintenanceTeam || !maintenanceTeam.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive maintenance team'
        });
      }
    }

    // Generate dummy email for testing (based on name)
    const emailBase = name.trim().toLowerCase().replace(/\s+/g, '.');
    const email = `${emailBase}@test.gearguard.local`;

    // Check if email already exists (handle duplicates)
    let emailToUse = email;
    let counter = 1;
    while (await User.findOne({ email: emailToUse })) {
      emailToUse = `${emailBase}${counter}@test.gearguard.local`;
      counter++;
    }

    // Generate dummy password for testing
    const plainPassword = 'test123'; // Simple password for testing
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Create user
    const user = new User({
      email: emailToUse,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      maintenanceTeam: team || undefined
    });

    await user.save();

    // Populate maintenance team if exists
    if (user.maintenanceTeam) {
      await user.populate('maintenanceTeam', 'name');
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });

  } catch (error) {
    // Handle duplicate key errors (unique email)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
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

module.exports = {
  createUser
};

