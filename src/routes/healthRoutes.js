/**
 * Health Routes
 * Defines all API endpoints for health data management
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// ========== DATA GENERATION ==========
/**
 * Generate new health data
 * POST /api/health/generate
 * Body: { status?: 'NORMAL' | 'WARNING' | 'DANGER' | 'NOT_WEARING', userId?: string }
 */
router.post('/generate', healthController.generateData);

// ========== DATA RETRIEVAL ==========
/**
 * Get latest health data
 * GET /api/health/latest
 */
router.get('/latest', healthController.getLatest);

/**
 * Get health data history
 * GET /api/health/history?limit=10&status=NORMAL&userId=user123
 */
router.get('/history', healthController.getHistory);

/**
 * Get health statistics
 * GET /api/health/stats
 */
router.get('/stats', healthController.getStats);

// ========== DATA SYNC ==========
/**
 * Receive health data from external source
 * POST /api/health/sync
 * Body: HealthData object
 */
router.post('/sync', healthController.receiveData);

// ========== MANAGEMENT ==========
/**
 * Clear all stored health data
 * DELETE /api/health/clear
 */
router.delete('/clear', healthController.clearData);

/**
 * Check API status
 * GET /api/health/status
 */
router.get('/status', healthController.checkStatus);

module.exports = router;
