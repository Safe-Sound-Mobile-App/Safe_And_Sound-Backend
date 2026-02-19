/**
 * Health Controller
 * Handles all health-related API endpoints
 */

const HealthData = require('../models/HealthData');
const { generateByStatus, generateRandom } = require('../services/dataGenerator');
const { calculateStatus } = require('../services/statusCalculator');

// In-memory storage for health data
let healthDataStore = [];
let latestData = null;

// Configuration
const MAX_STORED_RECORDS = 100;

/**
 * Generate new health data
 * POST /api/health/generate
 */
exports.generateData = (req, res) => {
    try {
        const { status, userId } = req.body;
        
        let healthData;
        if (status) {
            healthData = generateByStatus(status, userId);
        } else {
            healthData = generateRandom(userId);
        }

        // Calculate status if not already set
        if (!status) {
            const calculatedStatus = calculateStatus(healthData);
            healthData.status = calculatedStatus.status;
            healthData.alerts = calculatedStatus.alerts;
        }

        // Store data
        healthDataStore.push(healthData);
        latestData = healthData;

        // Limit stored records
        if (healthDataStore.length > MAX_STORED_RECORDS) {
            healthDataStore = healthDataStore.slice(-MAX_STORED_RECORDS);
        }

        console.log(`\n📊 Generated Health Data`);
        console.log(`Status: ${healthData.status}`);
        console.log(`HR: ${healthData.heartRate} BPM, SpO2: ${healthData.spo2}%`);
        console.log(`Alerts: ${healthData.alerts.join(', ') || 'None'}\n`);

        res.status(201).json({
            success: true,
            message: 'Health data generated successfully',
            data: healthData.toJSON(),
        });
    } catch (error) {
        console.error('❌ Error generating data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate health data',
        });
    }
};

/**
 * Get latest health data
 * GET /api/health/latest
 */
exports.getLatest = (req, res) => {
    if (!latestData) {
        return res.json({
            success: false,
            message: 'No health data available',
            data: null,
        });
    }

    res.json({
        success: true,
        data: latestData.toJSON(),
    });
};

/**
 * Get all stored health data
 * GET /api/health/history
 */
exports.getHistory = (req, res) => {
    const { limit = 10, status, userId } = req.query;
    
    let filteredData = [...healthDataStore];

    // Filter by status
    if (status) {
        filteredData = filteredData.filter(d => d.status === status.toUpperCase());
    }

    // Filter by userId
    if (userId) {
        filteredData = filteredData.filter(d => d.userId === userId);
    }

    // Limit results
    const limitNum = parseInt(limit);
    const results = filteredData.slice(-limitNum).reverse();

    res.json({
        success: true,
        count: results.length,
        total: healthDataStore.length,
        data: results.map(d => d.toJSON()),
    });
};

/**
 * Get statistics
 * GET /api/health/stats
 */
exports.getStats = (req, res) => {
    if (healthDataStore.length === 0) {
        return res.json({
            success: false,
            message: 'No data available for statistics',
        });
    }

    const stats = {
        total: healthDataStore.length,
        byStatus: {
            NORMAL: healthDataStore.filter(d => d.status === 'NORMAL').length,
            WARNING: healthDataStore.filter(d => d.status === 'WARNING').length,
            DANGER: healthDataStore.filter(d => d.status === 'DANGER').length,
            NOT_WEARING: healthDataStore.filter(d => d.status === 'NOT_WEARING').length,
        },
        averages: {
            heartRate: calculateAverage(healthDataStore, 'heartRate'),
            spo2: calculateAverage(healthDataStore, 'spo2'),
            temperature: calculateAverage(healthDataStore, 'temperature'),
            stress: calculateAverage(healthDataStore, 'stress'),
        },
        latest: latestData ? latestData.toJSON() : null,
    };

    res.json({
        success: true,
        data: stats,
    });
};

/**
 * Receive external health data (for future integration)
 * POST /api/health/sync
 */
exports.receiveData = (req, res) => {
    try {
        const healthData = new HealthData(req.body);

        // Calculate status
        const statusResult = calculateStatus(healthData);
        healthData.status = statusResult.status;
        healthData.alerts = statusResult.alerts;

        // Store data
        healthDataStore.push(healthData);
        latestData = healthData;

        // Limit stored records
        if (healthDataStore.length > MAX_STORED_RECORDS) {
            healthDataStore = healthDataStore.slice(-MAX_STORED_RECORDS);
        }

        console.log(`\n📥 Received Health Data`);
        console.log(`Status: ${healthData.status}`);
        console.log(`Alerts: ${healthData.alerts.join(', ') || 'None'}\n`);

        res.status(200).json({
            success: true,
            message: 'Health data received successfully',
            data: healthData.toJSON(),
        });
    } catch (error) {
        console.error('❌ Error receiving data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process health data',
        });
    }
};

/**
 * Clear all stored data
 * DELETE /api/health/clear
 */
exports.clearData = (req, res) => {
    const count = healthDataStore.length;
    healthDataStore = [];
    latestData = null;

    res.json({
        success: true,
        message: `Cleared ${count} health records`,
    });
};

/**
 * Check API status
 * GET /api/health/status
 */
exports.checkStatus = (req, res) => {
    res.json({
        success: true,
        message: 'Health API is running',
        version: '2.0.0',
        dataGeneration: 'enabled',
        recordsStored: healthDataStore.length,
        maxRecords: MAX_STORED_RECORDS,
    });
};

// Helper function to calculate average
function calculateAverage(data, field) {
    const values = data.map(d => d[field]).filter(v => v !== null && v !== undefined);
    if (values.length === 0) return null;
    const sum = values.reduce((a, b) => a + b, 0);
    return (sum / values.length).toFixed(2);
}

module.exports = exports;
