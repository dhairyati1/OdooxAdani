const Notification = require('../models/Notification');
const User = require('../models/User');
const MaintenanceRequest = require('../models/MaintenanceRequest');

/**
 * Notification Controller
 * 
 * Handles notification-related operations with role-based filtering.
 */

/**
 * Get notifications for the authenticated user
 * GET /api/notifications
 * 
 * Role-based filtering:
 * - User: Only their own notifications
 * - Technician: Notifications related to their team + assignments
 * - Manager: All system notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const { id: userId, role, team } = req.user;
    
    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Build query based on role
    let query = {};

    if (role === 'user') {
      // Users see only their own notifications
      query.user = userId;
    } else if (role === 'technician') {
      // Technicians see notifications for their user ID
      // (Notifications are created for specific users, including technicians)
      query.user = userId;
    } else if (role === 'manager') {
      // Managers see all notifications (global system notifications)
      // But we can also filter to show only manager-specific notifications
      // For now, we'll show all notifications where role is manager or user is the manager
      query = {
        $or: [
          { role: 'manager' },
          { user: userId }
        ]
      };
    }

    // Get notifications (latest first)
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50); // Limit to 50 most recent

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find notification and verify it belongs to the user
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Verify ownership (users can only mark their own notifications as read)
    if (notification.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notification'
      });
    }

    // Mark as read
    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read for the authenticated user
 * PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const { id: userId } = req.user;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Mark all unread notifications for this user as read
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to create notifications
 * This is used by other controllers to create notifications automatically
 */
const createNotification = async (notificationData) => {
  try {
    const {
      userId,
      role,
      message,
      type,
      relatedId,
      metadata
    } = notificationData;

    if (!userId || !role || !message || !type) {
      console.error('Invalid notification data:', notificationData);
      return null;
    }

    const notification = new Notification({
      user: userId,
      role,
      message,
      type,
      relatedId,
      metadata: metadata || {}
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Helper function to create notifications for multiple users
 * Used for team-based notifications (e.g., new request for technician team)
 */
const createNotificationsForUsers = async (userIds, notificationData) => {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return [];
    }

    const notifications = userIds.map(userId => ({
      user: userId,
      role: notificationData.role,
      message: notificationData.message,
      type: notificationData.type,
      relatedId: notificationData.relatedId,
      metadata: notificationData.metadata || {}
    }));

    const created = await Notification.insertMany(notifications);
    return created;
  } catch (error) {
    console.error('Error creating notifications for users:', error);
    return [];
  }
};

/**
 * Helper function to create notifications for all technicians in a team
 */
const createNotificationsForTeam = async (teamId, notificationData) => {
  try {
    // Find all active technicians in the team
    const technicians = await User.find({
      role: 'technician',
      maintenanceTeam: teamId,
      isActive: true
    }).select('_id');

    if (technicians.length === 0) {
      return [];
    }

    const userIds = technicians.map(t => t._id);
    return await createNotificationsForUsers(userIds, {
      ...notificationData,
      role: 'technician'
    });
  } catch (error) {
    console.error('Error creating notifications for team:', error);
    return [];
  }
};

/**
 * Helper function to create notification for managers
 */
const createNotificationForManagers = async (notificationData) => {
  try {
    // Find all active managers
    const managers = await User.find({
      role: 'manager',
      isActive: true
    }).select('_id');

    if (managers.length === 0) {
      return [];
    }

    const userIds = managers.map(m => m._id);
    return await createNotificationsForUsers(userIds, {
      ...notificationData,
      role: 'manager'
    });
  } catch (error) {
    console.error('Error creating notifications for managers:', error);
    return [];
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  createNotificationsForUsers,
  createNotificationsForTeam,
  createNotificationForManagers
};

