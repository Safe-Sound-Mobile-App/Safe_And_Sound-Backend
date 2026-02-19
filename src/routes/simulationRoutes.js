/**
 * Simulation Routes
 * Controls continuous health data simulation
 */

const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

/**
 * Start continuous simulation
 * POST /api/simulation/start
 */
router.post('/start', simulationController.startSimulation);

/**
 * Stop simulation
 * POST /api/simulation/stop
 */
router.post('/stop', simulationController.stopSimulation);

/**
 * Get simulation status
 * GET /api/simulation/status
 */
router.get('/status', simulationController.getSimulationStatus);

/**
 * Set update interval
 * POST /api/simulation/interval
 * Body: { interval: 2000 } // milliseconds
 */
router.post('/interval', simulationController.setUpdateInterval);

/**
 * Force specific status for an elder (testing)
 * POST /api/simulation/elder/:uid/force-status
 * Body: { status: 'NORMAL' | 'WARNING' | 'DANGER' | 'NOT_WEARING' }
 */
router.post('/elder/:uid/force-status', simulationController.forceElderStatus);

module.exports = router;
