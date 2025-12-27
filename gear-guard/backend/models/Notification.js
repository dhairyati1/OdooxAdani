const mongoose = require('mongoose');

/**
 * Notification Schema
 * 
 * Represents notifications for users based on system events.
 * Notifications are role-aware and user-specific.
 */
const notificationSchema = new mongoose.Schema({
  // User who should receive this notification
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true // Fast lookup by user
  },
  
  // Role of the user (for filtering)
  role: {
    type: String,
    enum: {
      values: ['user', 'technician', 'manager'],
      message: 'Role must be one of: user, technician, manager'
    },
    required: [true, 'Role is required'],
    index: true // Fast filtering by role
  },
  
  // Notification message
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  
  // Notification type (for categorization and UI styling)
  type: {
    type: String,
    enum: {
      values: [
        'request_created',
        'request_status_changed',
        'request_assigned',
        'equipment_created',
        'team_created'
      ],
      message: 'Invalid notification type'
    },
    required: [true, 'Type is required'],
    index: true
  },
  
  // Related entity ID (e.g., requestId, equipmentId, teamId)
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false, // Optional for some notification types
    index: true
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false,
    index: true // Fast filtering for unread notifications
  },
  
  // Additional metadata (flexible for future use)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
}, {
  timestamps: false, // We only use createdAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for common queries
// 1. Get unread notifications for a user
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// 2. Get all notifications for a user (latest first)
notificationSchema.index({ user: 1, createdAt: -1 });

// 3. Get notifications by role and read status
notificationSchema.index({ role: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

