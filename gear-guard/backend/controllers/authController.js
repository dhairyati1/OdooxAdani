const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Auth Controller
 * 
 * Handles authentication: login and registration
 */

/**
 * Login
 * POST /api/auth/login
 * 
 * Body: { email, password }
 * Returns: JWT token with user info
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('maintenanceTeam', '_id name');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        team: user.maintenanceTeam?._id?.toString() || null
      },
      process.env.JWT_SECRET || 'gear-guard-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Return token and user info (without password)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        team: user.maintenanceTeam?._id?.toString() || null,
        teamName: user.maintenanceTeam?.name || null,
        name: `${user.firstName} ${user.lastName}`
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Register (Simple registration for testing)
 * POST /api/auth/register
 * 
 * Body: { email, password, firstName, lastName, role, team (optional) }
 */
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, team } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, last name, and role are required'
      });
    }

    // Validate role
    if (!['user', 'technician', 'manager'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate team for technicians
    if (role === 'technician' && !team) {
      return res.status(400).json({
        success: false,
        message: 'Technicians must belong to a maintenance team'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role,
      maintenanceTeam: role === 'technician' ? team : undefined
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        team: user.maintenanceTeam?.toString() || null
      },
      process.env.JWT_SECRET || 'gear-guard-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Populate team for response
    await user.populate('maintenanceTeam', '_id name');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        team: user.maintenanceTeam?._id?.toString() || null,
        teamName: user.maintenanceTeam?.name || null,
        name: `${user.firstName} ${user.lastName}`
      }
    });

  } catch (error) {
    // Handle duplicate email
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Handle validation errors
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
  login,
  register
};

