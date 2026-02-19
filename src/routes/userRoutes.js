/**
 * User Routes
 * Manages users (elders and caregivers)
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// ========== USER CRUD ==========

/**
 * Create new user
 * POST /api/users
 * Body: { role: 'ELDER' | 'CAREGIVER', name, email, phone, ... }
 */
router.post('/', userController.createUser);

/**
 * Get all users
 * GET /api/users?role=ELDER
 */
router.get('/', userController.getAllUsers);

/**
 * Get specific user
 * GET /api/users/:uid
 */
router.get('/:uid', userController.getUser);

/**
 * Update user
 * PUT /api/users/:uid
 */
router.put('/:uid', userController.updateUser);

/**
 * Delete user
 * DELETE /api/users/:uid
 */
router.delete('/:uid', userController.deleteUser);

// ========== ROLE-SPECIFIC ==========

/**
 * Get all elders
 * GET /api/users/elders/all
 */
router.get('/elders/all', userController.getAllElders);

/**
 * Get all caregivers
 * GET /api/users/caregivers/all
 */
router.get('/caregivers/all', userController.getAllCaregivers);

// ========== RELATIONSHIPS ==========

/**
 * Assign caregiver to elder
 * POST /api/users/elder/:elderUID/assign-caregiver
 * Body: { caregiverUID }
 */
router.post('/elder/:elderUID/assign-caregiver', userController.assignCaregiver);

/**
 * Get elders for a caregiver
 * GET /api/users/caregiver/:caregiverUID/elders
 */
router.get('/caregiver/:caregiverUID/elders', userController.getEldersForCaregiver);

module.exports = router;
