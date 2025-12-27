const express = require('express');
const router = express.Router();
const { createEquipment, getEquipment } = require('../controllers/equipmentController');

/**
 * Equipment Routes
 * 
 * All equipment-related endpoints
 */

// GET /api/equipment - Get all equipment
router.get('/', getEquipment);

// POST /api/equipment - Create new equipment (manager-only)
// TODO: Add auth middleware to verify authentication
// TODO: Add role-based middleware to restrict to managers
router.post('/', createEquipment);

module.exports = router;

