const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');

/**
 * Notification Routes
 * 
 * All routes require authentication (handled by auth middleware in app.js)
 */

// GET /api/notifications - Get all notifications for authenticated user
router.get('/', getNotifications);

// PATCH /api/notifications/:id/read - Mark a notification as read
router.patch('/:id/read', markAsRead);

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', markAllAsRead);

module.exports = router;

