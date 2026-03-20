/**
 * Auto Simulation Routes
 * Enables per-elder auto simulation toggles.
 */

const express = require('express');
const router  = express.Router();

const autoSimService = require('../services/autoSimService');

router.post('/:elderId/start', (req, res) => {
    try {
        const { elderId } = req.params;
        const result = autoSimService.startForElder(elderId);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: err?.message || 'Failed to start auto sim' });
    }
});

router.post('/:elderId/stop', (req, res) => {
    try {
        const { elderId } = req.params;
        const result = autoSimService.stopForElder(elderId);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, message: err?.message || 'Failed to stop auto sim' });
    }
});

router.get('/status', (req, res) => {
    try {
        const status = autoSimService.getStatus();
        res.json({ success: true, ...status });
    } catch (err) {
        res.status(500).json({ success: false, message: err?.message || 'Failed to get status' });
    }
});

module.exports = router;

