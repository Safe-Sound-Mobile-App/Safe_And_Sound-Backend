/**
 * Elder Health Routes
 * Health data endpoints for individual elders and all elders
 */

const express = require('express');
const router = express.Router();
const elderHealthController = require('../controllers/elderHealthController');

// ========== INDIVIDUAL ELDER HEALTH DATA ==========

/**
 * Generate health data for specific elder
 * POST /api/health/elder/:uid/generate
 * Body: { status?: 'NORMAL' | 'WARNING' | 'DANGER' | 'NOT_WEARING' }
 */
router.post('/elder/:uid/generate', elderHealthController.generateDataForElder);

/**
 * Get latest health data for specific elder
 * GET /api/health/elder/:uid/latest
 */
router.get('/elder/:uid/latest', elderHealthController.getLatestForElder);

/**
 * Get health history for specific elder
 * GET /api/health/elder/:uid/history?limit=10
 */
router.get('/elder/:uid/history', elderHealthController.getHistoryForElder);

/**
 * Get statistics for specific elder
 * GET /api/health/elder/:uid/stats
 */
router.get('/elder/:uid/stats', elderHealthController.getStatsForElder);

/**
 * Sync external health data for specific elder
 * POST /api/health/elder/:uid/sync
 * Body: HealthData object
 */
router.post('/elder/:uid/sync', elderHealthController.syncElderData);

/**
 * Clear health records for specific elder
 * DELETE /api/health/elder/:uid/clear
 */
router.delete('/elder/:uid/clear', elderHealthController.clearElderData);

// ========== ALL ELDERS HEALTH DATA ==========

/**
 * Get latest health data for ALL elders
 * GET /api/health/elders/latest
 */
router.get('/elders/latest', elderHealthController.getLatestForAllElders);

/**
 * Get statistics for ALL elders
 * GET /api/health/elders/stats
 */
router.get('/elders/stats', elderHealthController.getStatsForAllElders);

/**
 * Get overview of all elders with current status
 * GET /api/health/elders/overview
 */
router.get('/elders/overview', elderHealthController.getEldersOverview);

// ========== CAREGIVER-SPECIFIC ==========

/**
 * Get elders for a caregiver with their latest health data
 * GET /api/health/caregiver/:caregiverUID/elders
 */
router.get('/caregiver/:caregiverUID/elders', elderHealthController.getEldersForCaregiver);

module.exports = router;
