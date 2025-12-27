const express = require('express');
const router = express.Router();
const { createUser } = require('../controllers/userController');

/**
 * User Routes
 * 
 * Minimal endpoints for testing/hackathon purposes.
 * No auth middleware - for testing only.
 */

// POST /api/users - Create new user
router.post('/', createUser);

module.exports = router;

