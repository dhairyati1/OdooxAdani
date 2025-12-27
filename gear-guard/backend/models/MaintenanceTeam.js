const mongoose = require('mongoose');

/**
 * MaintenanceTeam Schema
 * 
 * Represents a team of technicians who work together on maintenance requests.
 * Equipment has a default team, and requests inherit the team from their equipment.
 * Technicians can only see and work on requests from their team (unless they're managers).
 */
const maintenanceTeamSchema = new mongoose.Schema({
  // Team identity
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    unique: true,
    index: true // Fast lookup by name
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Team members are referenced via User.maintenanceTeam (reverse relationship)
  // This field is optional but useful for quick team member lookups
  // Note: The source of truth is User.maintenanceTeam, not this array
  memberCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Soft delete flag
  isActive: {
    type: Boolean,
    default: true,
    index: true // Filter active teams efficiently
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to get all team members (technicians assigned to this team)
maintenanceTeamSchema.virtual('members', {
  ref: 'User',
  localField: '_id',
  foreignField: 'maintenanceTeam',
  match: { isActive: true, role: 'technician' }
});

// Index for active teams (common filter)
maintenanceTeamSchema.index({ isActive: 1, name: 1 });

module.exports = mongoose.model('MaintenanceTeam', maintenanceTeamSchema);

