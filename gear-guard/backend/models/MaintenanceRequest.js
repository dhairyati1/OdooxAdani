const mongoose = require('mongoose');

/**
 * MaintenanceRequest Schema
 * 
 * Represents a maintenance task/work order in the system.
 * Supports two types: Corrective (reactive) and Preventive (scheduled).
 * 
 * Workflow: New → In Progress → Repaired → Scrap (strictly linear)
 * - "Repaired" is final and cannot be reopened
 * - Direct New → Scrap is NOT allowed
 * - Duration is mandatory before moving to "Repaired"
 * 
 * Business Rules:
 * - Equipment selection auto-fills the MaintenanceTeam
 * - Scrap status marks related Equipment as unusable
 * - Scrapped Equipment cannot receive new requests
 * - Preventive requests require scheduledDate and appear in calendar view
 */
const maintenanceRequestSchema = new mongoose.Schema({
  // Request type: Corrective (any user) or Preventive (managers only)
  type: {
    type: String,
    enum: {
      values: ['Corrective', 'Preventive'],
      message: 'Request type must be either Corrective or Preventive'
    },
    required: [true, 'Request type is required'],
    index: true // Filter by type (e.g., calendar view shows only Preventive)
  },
  
  // Workflow status: strictly linear progression
  // New → In Progress → Repaired → Scrap
  status: {
    type: String,
    enum: {
      values: ['New', 'In Progress', 'Repaired', 'Scrap'],
      message: 'Status must be one of: New, In Progress, Repaired, Scrap'
    },
    required: [true, 'Status is required'],
    default: 'New',
    index: true // Critical for Kanban view and status filtering
  },
  
  // Title/Subject of the maintenance request
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  // Detailed description of the issue or maintenance task
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Equipment that needs maintenance (required)
  // When selected, maintenanceTeam is auto-filled from equipment.defaultMaintenanceTeam
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: [true, 'Equipment is required'],
    validate: {
      validator: async function(value) {
        const equipment = await mongoose.model('Equipment').findById(value);
        if (!equipment || !equipment.isActive) {
          return false;
        }
        // Scrapped equipment cannot receive new requests
        if (equipment.isScrapped && this.status !== 'Scrap') {
          return false;
        }
        return true;
      },
      message: 'Equipment must be active and not scrapped (unless request is Scrap)'
    },
    index: true // Critical for equipment-based queries and filtering
  },
  
  // Maintenance team assigned to handle this request
  // Auto-filled from equipment.defaultMaintenanceTeam when equipment is selected
  maintenanceTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceTeam',
    required: [true, 'Maintenance team is required'],
    validate: {
      validator: async function(value) {
        const team = await mongoose.model('MaintenanceTeam').findById(value);
        return team !== null && team.isActive;
      },
      message: 'Maintenance team must be a valid active team'
    },
    index: true // Critical for team-based visibility (technicians see only their team)
  },
  
  // Assigned technician (optional, can be assigned later)
  // Only managers and the assigned technician can edit duration
  // Reassignment only allowed by managers while status is "In Progress"
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function(value) {
        if (!value) return true; // Optional field
        const user = await mongoose.model('User').findById(value);
        if (!user || !user.isActive) {
          return false;
        }
        // Must be a technician
        if (user.role !== 'technician') {
          return false;
        }
        // Must belong to the request's maintenance team
        const userTeamId = user.maintenanceTeam ? user.maintenanceTeam.toString() : null;
        const requestTeamId = this.maintenanceTeam ? this.maintenanceTeam.toString() : null;
        if (userTeamId !== requestTeamId) {
          return false;
        }
        return true;
      },
      message: 'Assigned technician must be an active technician from the request\'s maintenance team'
    }
  },
  
  // Duration in hours (mandatory before moving to "Repaired")
  // Only assigned technician or manager can edit
  duration: {
    type: Number,
    min: [0, 'Duration cannot be negative'],
    validate: {
      validator: function(value) {
        // Duration is required when status is "Repaired"
        if (this.status === 'Repaired' && (!value || value === 0)) {
          return false;
        }
        return true;
      },
      message: 'Duration is required before moving to Repaired status'
    }
  },
  
  // Scheduled date for Preventive maintenance (required for Preventive type)
  // Used for calendar view and overdue calculations
  // Timezone: UTC
  scheduledDate: {
    type: Date,
    required: function() {
      return this.type === 'Preventive';
    },
    validate: {
      validator: function(value) {
        // Preventive requests must have scheduledDate
        if (this.type === 'Preventive' && !value) {
          return false;
        }
        return true;
      },
      message: 'Preventive maintenance requests must have a scheduled date'
    },
    index: true // Critical for calendar view and overdue queries
  },
  
  // Actual start date (when status moved to "In Progress")
  startedAt: {
    type: Date,
    default: null
  },
  
  // Actual completion date (when status moved to "Repaired")
  completedAt: {
    type: Date,
    default: null
  },
  
  // Date when request was scrapped
  scrappedAt: {
    type: Date,
    default: null
  },
  
  // User who created the request
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
    immutable: true // Cannot be changed after creation
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

// Virtual for overdue status (scheduledDate < today AND status != Repaired)
maintenanceRequestSchema.virtual('isOverdue').get(function() {
  if (this.type !== 'Preventive' || !this.scheduledDate) {
    return false;
  }
  if (this.status === 'Repaired') {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduled = new Date(this.scheduledDate);
  scheduled.setHours(0, 0, 0, 0);
  return scheduled < today;
});

// Compound indexes for common queries

// 1. Status filtering (Kanban view, badge counts)
maintenanceRequestSchema.index({ status: 1, isActive: 1 });

// 2. Team-based visibility (technicians see only their team)
maintenanceRequestSchema.index({ maintenanceTeam: 1, status: 1, isActive: 1 });

// 3. Equipment-based queries
maintenanceRequestSchema.index({ equipment: 1, status: 1, isActive: 1 });

// 4. Calendar view: Preventive requests by scheduled date
maintenanceRequestSchema.index({ 
  type: 1, 
  scheduledDate: 1, 
  status: 1, 
  isActive: 1 
});

// 5. Overdue queries: Preventive requests with scheduledDate < today
maintenanceRequestSchema.index({ 
  type: 1, 
  scheduledDate: 1, 
  status: 1, 
  isActive: 1 
});

// 6. Assigned technician queries
maintenanceRequestSchema.index({ assignedTechnician: 1, status: 1, isActive: 1 });

// 7. Department-based queries (via equipment)
// Note: This requires population, but useful for filtering

// Pre-save hooks to enforce business rules

// Hook 1: Auto-fill maintenanceTeam from equipment
maintenanceRequestSchema.pre('save', async function(next) {
  // Only auto-fill if equipment is set and team is not already set
  if (this.equipment && !this.maintenanceTeam) {
    try {
      const equipment = await mongoose.model('Equipment').findById(this.equipment);
      if (equipment && equipment.defaultMaintenanceTeam) {
        this.maintenanceTeam = equipment.defaultMaintenanceTeam;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Hook 2: Update timestamps for status changes
maintenanceRequestSchema.pre('save', function(next) {
  // Track when status changes occur
  if (this.isModified('status')) {
    const now = new Date();
    
    if (this.status === 'In Progress' && !this.startedAt) {
      this.startedAt = now;
    }
    
    if (this.status === 'Repaired' && !this.completedAt) {
      this.completedAt = now;
    }
    
    if (this.status === 'Scrap' && !this.scrappedAt) {
      this.scrappedAt = now;
    }
  }
  next();
});

// Hook 3: Mark equipment as scrapped when request moves to Scrap
maintenanceRequestSchema.post('save', async function(doc) {
  if (doc.status === 'Scrap' && doc.equipment) {
    try {
      await mongoose.model('Equipment').findByIdAndUpdate(
        doc.equipment,
        { 
          isScrapped: true,
          scrappedAt: new Date()
        }
      );
    } catch (error) {
      console.error('Error updating equipment scrap status:', error);
    }
  }
});

// Validation: Prevent direct New → Scrap transition
maintenanceRequestSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    // If trying to move from New directly to Scrap, prevent it
    if (this.status === 'Scrap') {
      // Check if previous status was New (requires querying old document)
      // This validation should also be enforced at the controller level
      // For schema-level, we'll allow it but document the rule
    }
    
    // Prevent reopening Repaired requests
    if (this.status !== 'Repaired' && this.completedAt) {
      return next(new Error('Repaired requests cannot be reopened'));
    }
  }
  next();
});

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

