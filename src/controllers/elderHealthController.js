/**
 * Elder Health Controller
 * Handles health data for individual elders and all elders
 */

const dataStore = require('../services/dataStore');
const { generateByStatus, generateRandom } = require('../services/dataGenerator');
const { calculateStatus } = require('../services/statusCalculator');
const simulationService = require('../services/simulationService');

/**
 * Generate health data for a specific elder
 * POST /api/health/elder/:uid/generate
 */
exports.generateDataForElder = (req, res) => {
    try {
        const { uid } = req.params;
        const { status } = req.body;

        // Verify elder exists
        const elder = dataStore.getUser(uid);
        if (!elder || !elder.isElder()) {
            return res.status(404).json({
                success: false,
                error: 'Elder not found',
            });
        }

        // Generate health data
        let healthData;
        if (status) {
            healthData = generateByStatus(status, uid);
        } else {
            healthData = generateRandom(uid);
        }

        // Calculate status
        const statusResult = calculateStatus(healthData);
        healthData.status = statusResult.status;
        healthData.alerts = statusResult.alerts;

        // Save to data store
        const record = dataStore.saveHealthRecord(uid, healthData);

        console.log(`\n📊 Generated data for ${elder.name}: ${healthData.status}`);

        res.status(201).json({
            success: true,
            message: 'Health data generated successfully',
            data: record.toJSON(),
        });
    } catch (error) {
        console.error('❌ Error generating data for elder:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate health data',
            message: error.message,
        });
    }
};

/**
 * Get latest health data for a specific elder
 * GET /api/health/elder/:uid/latest
 */
exports.getLatestForElder = (req, res) => {
    try {
        const { uid } = req.params;

        // Verify elder exists
        const elder = dataStore.getUser(uid);
        if (!elder || !elder.isElder()) {
            return res.status(404).json({
                success: false,
                error: 'Elder not found',
            });
        }

        const record = dataStore.getLatestHealthData(uid);

        if (!record) {
            return res.json({
                success: false,
                message: 'No health data available for this elder',
                data: null,
            });
        }

        res.json({
            success: true,
            elder: elder.toJSON(),
            data: record.toJSON(),
        });
    } catch (error) {
        console.error('❌ Error getting latest data for elder:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get health data',
        });
    }
};

/**
 * Get health history for a specific elder
 * GET /api/health/elder/:uid/history
 */
exports.getHistoryForElder = (req, res) => {
    try {
        const { uid } = req.params;
        const { limit = 10 } = req.query;

        // Verify elder exists
        const elder = dataStore.getUser(uid);
        if (!elder || !elder.isElder()) {
            return res.status(404).json({
                success: false,
                error: 'Elder not found',
            });
        }

        const records = dataStore.getHealthHistory(uid, parseInt(limit));

        res.json({
            success: true,
            elder: elder.toJSON(),
            count: records.length,
            data: records.map(r => r.toJSON()),
        });
    } catch (error) {
        console.error('❌ Error getting history for elder:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get health history',
        });
    }
};

/**
 * Get statistics for a specific elder
 * GET /api/health/elder/:uid/stats
 */
exports.getStatsForElder = (req, res) => {
    try {
        const { uid } = req.params;

        // Verify elder exists
        const elder = dataStore.getUser(uid);
        if (!elder || !elder.isElder()) {
            return res.status(404).json({
                success: false,
                error: 'Elder not found',
            });
        }

        const stats = dataStore.getElderStats(uid);

        if (!stats) {
            return res.json({
                success: false,
                message: 'No health data available for statistics',
            });
        }

        res.json({
            success: true,
            elder: elder.toJSON(),
            data: stats,
        });
    } catch (error) {
        console.error('❌ Error getting stats for elder:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get statistics',
        });
    }
};

/**
 * Get latest health data for ALL elders
 * GET /api/health/elders/latest
 */
exports.getLatestForAllElders = (req, res) => {
    try {
        const results = dataStore.getAllLatestHealthData();

        res.json({
            success: true,
            count: results.length,
            data: results,
        });
    } catch (error) {
        console.error('❌ Error getting latest data for all elders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get health data',
        });
    }
};

/**
 * Get statistics for ALL elders
 * GET /api/health/elders/stats
 */
exports.getStatsForAllElders = (req, res) => {
    try {
        const stats = dataStore.getAllEldersStats();

        res.json({
            success: true,
            count: stats.length,
            data: stats,
        });
    } catch (error) {
        console.error('❌ Error getting stats for all elders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get statistics',
        });
    }
};

/**
 * Get overview of all elders with their current status
 * GET /api/health/elders/overview
 */
exports.getEldersOverview = (req, res) => {
    try {
        const elders = dataStore.getAllElders();
        const overview = elders.map(elder => {
            const latestData = dataStore.getLatestHealthData(elder.uid);
            return {
                elder: elder.toJSON(),
                latestStatus: latestData?.healthData?.status || 'NO_DATA',
                latestUpdate: latestData?.healthData?.receivedAt || null,
                hasData: !!latestData,
            };
        });

        // Group by status
        const byStatus = {
            NORMAL: overview.filter(o => o.latestStatus === 'NORMAL').length,
            WARNING: overview.filter(o => o.latestStatus === 'WARNING').length,
            DANGER: overview.filter(o => o.latestStatus === 'DANGER').length,
            NOT_WEARING: overview.filter(o => o.latestStatus === 'NOT_WEARING').length,
            NO_DATA: overview.filter(o => o.latestStatus === 'NO_DATA').length,
        };

        res.json({
            success: true,
            totalElders: elders.length,
            byStatus,
            data: overview,
        });
    } catch (error) {
        console.error('❌ Error getting elders overview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get elders overview',
        });
    }
};

/**
 * Clear health records for a specific elder
 * DELETE /api/health/elder/:uid/clear
 */
exports.clearElderData = (req, res) => {
    try {
        const { uid } = req.params;

        // Verify elder exists
        const elder = dataStore.getUser(uid);
        if (!elder || !elder.isElder()) {
            return res.status(404).json({
                success: false,
                error: 'Elder not found',
            });
        }

        dataStore.clearElderHealthRecords(uid);

        res.json({
            success: true,
            message: `Cleared health records for ${elder.name}`,
        });
    } catch (error) {
        console.error('❌ Error clearing elder data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear data',
        });
    }
};

/**
 * Sync external health data for an elder
 * POST /api/health/elder/:uid/sync
 */
exports.syncElderData = (req, res) => {
    try {
        const { uid } = req.params;

        // Verify elder exists
        const elder = dataStore.getUser(uid);
        if (!elder || !elder.isElder()) {
            return res.status(404).json({
                success: false,
                error: 'Elder not found',
            });
        }

        // Create health data from request body
        const healthData = req.body;
        healthData.userId = uid;

        // Calculate status
        const statusResult = calculateStatus(healthData);
        healthData.status = statusResult.status;
        healthData.alerts = statusResult.alerts;

        // Save to data store
        const record = dataStore.saveHealthRecord(uid, healthData);

        console.log(`\n📥 Synced data for ${elder.name}: ${healthData.status}`);

        res.status(200).json({
            success: true,
            message: 'Health data synced successfully',
            data: record.toJSON(),
        });
    } catch (error) {
        console.error('❌ Error syncing elder data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync health data',
            message: error.message,
        });
    }
};

/**
 * Get elders assigned to a caregiver with their latest health data
 * GET /api/health/caregiver/:caregiverUID/elders
 */
exports.getEldersForCaregiver = (req, res) => {
    try {
        const { caregiverUID } = req.params;

        const caregiver = dataStore.getUser(caregiverUID);
        if (!caregiver || !caregiver.isCaregiver()) {
            return res.status(404).json({
                success: false,
                error: 'Caregiver not found',
            });
        }

        const elders = dataStore.getEldersForCaregiver(caregiverUID);
        const results = elders.map(elder => {
            const latestData = dataStore.getLatestHealthData(elder.uid);
            return {
                elder: elder.toJSON(),
                healthData: latestData ? latestData.toJSON() : null,
            };
        });

        res.json({
            success: true,
            caregiver: caregiver.toJSON(),
            count: results.length,
            data: results,
        });
    } catch (error) {
        console.error('❌ Error getting elders for caregiver:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get elders',
        });
    }
};

module.exports = exports;
