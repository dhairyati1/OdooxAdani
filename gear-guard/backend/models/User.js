const mongoose = require('mongoose');

/**
 * User Schema
 * 
 * Represents all authenticated users in the system (users, technicians, managers).
 * Technicians must belong to a MaintenanceTeam to be assigned to requests.
 * Managers have elevated permissions for creating equipment, preventive requests, and reassigning work.
 */
const userSchema = new mongoose.Schema({
  // Authentication & Identity
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    index: true // Fast lookup for authentication
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Never return password in queries by default
  },
  
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  
  // Role-based access control
  role: {
    type: String,
    enum: {
      values: ['user', 'technician', 'manager'],
      message: 'Role must be one of: user, technician, manager'
    },
    required: [true, 'Role is required'],
    default: 'user',
    index: true // Fast filtering by role for permission checks
  },
  
  // Team assignment (required for technicians, optional for others)
  // Technicians can only work on requests from their team
  maintenanceTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceTeam',
    required: function() {
      // Technicians must belong to a team
      return this.role === 'technician';
    },
    validate: {
      validator: async function(value) {
        if (this.role === 'technician' && !value) {
          return false;
        }
        if (value) {
          const team = await mongoose.model('MaintenanceTeam').findById(value);
          return team !== null;
        }
        return true;
      },
      message: 'Technicians must belong to a valid MaintenanceTeam'
    }
  },
  
  // Soft delete flag (no hard deletes per business rules)
  isActive: {
    type: Boolean,
    default: true,
    index: true // Filter active users efficiently
  },
  
  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Auto-manage createdAt/updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name (useful for display)
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for common queries: active users by role and team
userSchema.index({ role: 1, maintenanceTeam: 1, isActive: 1 });

module.exports = mongoose.model('User', userSchema);

