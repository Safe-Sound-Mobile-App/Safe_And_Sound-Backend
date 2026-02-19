/**
 * Simulation Controller
 * Controls the continuous health data simulation
 */

const simulationService = require('../services/simulationService');
const dataStore = require('../services/dataStore');

/**
 * Start simulation
 * POST /api/simulation/start
 */
exports.startSimulation = (req, res) => {
    try {
        simulationService.start();
        
        res.json({
            success: true,
            message: 'Simulation started',
            status: simulationService.getStatus(),
        });
    } catch (error) {
        console.error('❌ Error starting simulation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start simulation',
        });
    }
};

/**
 * Stop simulation
 * POST /api/simulation/stop
 */
exports.stopSimulation = (req, res) => {
    try {
        simulationService.stop();
        
        res.json({
            success: true,
            message: 'Simulation stopped',
            status: simulationService.getStatus(),
        });
    } catch (error) {
        console.error('❌ Error stopping simulation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to stop simulation',
        });
    }
};

/**
 * Get simulation status
 * GET /api/simulation/status
 */
exports.getSimulationStatus = (req, res) => {
    try {
        const status = simulationService.getStatus();
        const storeSummary = dataStore.getSummary();
        
        res.json({
            success: true,
            simulation: status,
            dataStore: storeSummary,
        });
    } catch (error) {
        console.error('❌ Error getting simulation status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get simulation status',
        });
    }
};

/**
 * Set simulation update interval
 * POST /api/simulation/interval
 */
exports.setUpdateInterval = (req, res) => {
    try {
        const { interval } = req.body;
        
        if (!interval || interval < 100) {
            return res.status(400).json({
                success: false,
                error: 'Interval must be at least 100ms',
            });
        }

        simulationService.setUpdateInterval(interval);
        
        res.json({
            success: true,
            message: `Update interval set to ${interval}ms`,
            status: simulationService.getStatus(),
        });
    } catch (error) {
        console.error('❌ Error setting interval:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to set interval',
        });
    }
};

/**
 * Force a specific status for an elder (for testing)
 * POST /api/simulation/elder/:uid/force-status
 */
exports.forceElderStatus = (req, res) => {
    try {
        const { uid } = req.params;
        const { status } = req.body;

        if (!['NORMAL', 'WARNING', 'DANGER', 'NOT_WEARING'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
            });
        }

        const elder = dataStore.getUser(uid);
        if (!elder || !elder.isElder()) {
            return res.status(404).json({
                success: false,
                error: 'Elder not found',
            });
        }

        simulationService.setElderStatus(uid, status);
        
        res.json({
            success: true,
            message: `Forced status ${status} for elder ${elder.name}`,
        });
    } catch (error) {
        console.error('❌ Error forcing status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to force status',
        });
    }
};

module.exports = exports;
