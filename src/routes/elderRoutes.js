/**
 * Elder Routes
 * Fetches elder data directly from Firebase (Admin SDK — no auth required).
 */

const express = require('express');
const router  = express.Router();
const { getEldersWithHealthData, getHealthData } = require('../services/firebaseService');

/**
 * GET /api/elders
 * Returns all users with role == 'elder' along with their latest healthData document.
 */
router.get('/', async (req, res) => {
    try {
        const data = await getEldersWithHealthData();
        res.json({
            success: true,
            count:   data.length,
            data,
        });
    } catch (error) {
        console.error('❌ Failed to fetch elders:', error.message);
        res.status(500).json({
            success: false,
            error:   'Failed to fetch elders from Firebase',
            message: error.message,
        });
    }
});

/**
 * GET /api/elders/:elderId/health
 * Returns the latest healthData document for a specific elder.
 */
router.get('/:elderId/health', async (req, res) => {
    try {
        const { elderId } = req.params;
        const healthData  = await getHealthData(elderId);

        res.json({
            success:    true,
            elderId,
            healthData: healthData || null,
        });
    } catch (error) {
        console.error('❌ Failed to fetch health data:', error.message);
        res.status(500).json({
            success: false,
            error:   'Failed to fetch health data',
            message: error.message,
        });
    }
});

module.exports = router;
