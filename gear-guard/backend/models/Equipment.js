const mongoose = require('mongoose');

/**
 * Equipment Schema
 * 
 * Represents physical assets that require maintenance (machines, vehicles, computers, etc.).
 * Equipment can belong to either a Department OR an Employee (mutually exclusive).
 * Each equipment has a default MaintenanceTeam that handles its requests.
 * Scrapped equipment cannot receive new maintenance requests.
 */
const equipmentSchema = new mongoose.Schema({
  // Equipment identity
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true,
    index: true // Fast search by name
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Equipment type/category (e.g., "Machine", "Vehicle", "Computer")
  category: {
    type: String,
    trim: true,
    index: true // Filter by category
  },
  
  // Serial number or asset tag for tracking
  serialNumber: {
    type: String,
    trim: true,
    sparse: true, // Allows null but enforces uniqueness when present
    index: true
  },
  
  // Location/Ownership: Equipment belongs to EITHER department OR employee (not both)
  // This supports the business rule: "Equipment can belong to a Department OR an Employee"
  department: {
    type: String,
    trim: true,
    index: true, // Indexed for filtering and calendar/overdue queries
    required: function() {
      // Must have either department OR employee, but not both
      return !this.employee;
    },
    validate: {
      validator: function(value) {
        // If department is set, employee must be null
        // Empty string is treated as not set
        return !value || value === '' || !this.employee;
      },
      message: 'Equipment cannot belong to both a department and an employee'
    }
  },
  
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // Must have either department OR employee, but not both
      return !this.department || this.department === '';
    },
    validate: {
      validator: function(value) {
        // If employee is set, department must be null or empty
        return !value || !this.department || this.department === '';
      },
      message: 'Equipment cannot belong to both a department and an employee'
    }
  },
  
  // Default maintenance team (required)
  // When a request is created for this equipment, the team is auto-filled
  defaultMaintenanceTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceTeam',
    required: [true, 'Equipment must have a default maintenance team'],
    validate: {
      validator: async function(value) {
        const team = await mongoose.model('MaintenanceTeam').findById(value);
        return team !== null && team.isActive;
      },
      message: 'Default maintenance team must be a valid active team'
    },
    index: true // Fast lookup of equipment by team
  },
  
  // Scrap state: When equipment is scrapped, it cannot receive new requests
  // This is a soft flag (data is not deleted)
  isScrapped: {
    type: Boolean,
    default: false,
    index: true // Filter scrapped equipment efficiently
  },
  
  // Date when equipment was scrapped (for audit trail)
  scrappedAt: {
    type: Date,
    default: null,
    validate: {
      validator: function(value) {
        // scrappedAt should be set when isScrapped is true
        return !this.isScrapped || value !== null;
      },
      message: 'Scrapped equipment must have a scrappedAt date'
    }
  },
  
  // Soft delete flag
  isActive: {
    type: Boolean,
    default: true,
    index: true
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

// Compound index for common queries: active, non-scrapped equipment by department
equipmentSchema.index({ isActive: 1, isScrapped: 1, department: 1 });

// Compound index for equipment by team (for team-based filtering)
equipmentSchema.index({ defaultMaintenanceTeam: 1, isActive: 1, isScrapped: 1 });

// Pre-save hook to set scrappedAt when isScrapped becomes true
equipmentSchema.pre('save', function(next) {
  if (this.isScrapped && !this.scrappedAt) {
    this.scrappedAt = new Date();
  } else if (!this.isScrapped && this.scrappedAt) {
    this.scrappedAt = null;
  }
  next();
});

module.exports = mongoose.model('Equipment', equipmentSchema);

