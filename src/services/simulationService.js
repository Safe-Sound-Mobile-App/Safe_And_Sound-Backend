/**
 * Simulation Service
 * Continuously generates health data for elders (simulates real-time monitoring)
 */

const dataStore = require('./dataStore');
const { generateByStatus, generateRandom } = require('./dataGenerator');
const { calculateStatus } = require('./statusCalculator');

class SimulationService {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.updateInterval = 2000; // 2 seconds (simulating real measurement frequency)
        this.elderSimulationStates = new Map(); // elderUID -> current status tendency
    }

    /**
     * Start continuous simulation for all active elders
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️  Simulation already running');
            return;
        }

        this.isRunning = true;
        console.log(`\n🔄 Starting continuous health data simulation`);
        console.log(`📊 Update interval: ${this.updateInterval / 1000}s\n`);

        this.intervalId = setInterval(() => {
            this.generateDataForAllElders();
        }, this.updateInterval);
    }

    /**
     * Stop simulation
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('\n⏹️  Simulation stopped\n');
    }

    /**
     * Set update interval
     */
    setUpdateInterval(milliseconds) {
        this.updateInterval = milliseconds;
        if (this.isRunning) {
            this.stop();
            this.start();
        }
        console.log(`⏱️  Update interval set to ${milliseconds / 1000}s`);
    }

    /**
     * Generate data for all active elders
     */
    generateDataForAllElders() {
        const elders = dataStore.getAllElders().filter(elder => elder.isActive);
        
        if (elders.length === 0) {
            return;
        }

        elders.forEach(elder => {
            try {
                this.generateDataForElder(elder.uid);
            } catch (error) {
                console.error(`❌ Error generating data for elder ${elder.uid}:`, error.message);
            }
        });
    }

    /**
     * Generate health data for a specific elder
     */
    generateDataForElder(elderUID) {
        // Get or initialize simulation state for this elder
        if (!this.elderSimulationStates.has(elderUID)) {
            this.elderSimulationStates.set(elderUID, {
                currentStatus: 'NORMAL',
                statusChangeCounter: 0,
                statusChangeProbability: 0.1, // 10% chance to change status
            });
        }

        const state = this.elderSimulationStates.get(elderUID);

        // Decide if status should change (simulate realistic variations)
        const shouldChangeStatus = Math.random() < state.statusChangeProbability;
        
        if (shouldChangeStatus) {
            state.currentStatus = this.getNextStatus(state.currentStatus);
            state.statusChangeCounter++;
        }

        // Generate health data
        const healthData = generateByStatus(state.currentStatus, elderUID);

        // Calculate actual status (might differ slightly from intended)
        const statusResult = calculateStatus(healthData);
        healthData.status = statusResult.status;
        healthData.alerts = statusResult.alerts;

        // Save to data store
        dataStore.saveHealthRecord(elderUID, healthData);

        // Log occasionally (every 10th update)
        if (state.statusChangeCounter % 10 === 0) {
            const elder = dataStore.getUser(elderUID);
            console.log(`📊 [${elder.name}] Status: ${healthData.status}, HR: ${healthData.heartRate}, SpO2: ${healthData.spo2}%`);
        }
    }

    /**
     * Get next status based on weighted probabilities
     */
    getNextStatus(currentStatus) {
        const transitions = {
            'NORMAL': {
                'NORMAL': 0.85,    // 85% stay normal
                'WARNING': 0.12,   // 12% warning
                'DANGER': 0.02,    // 2% danger
                'NOT_WEARING': 0.01 // 1% not wearing
            },
            'WARNING': {
                'NORMAL': 0.40,    // 40% return to normal
                'WARNING': 0.50,   // 50% stay warning
                'DANGER': 0.09,    // 9% escalate to danger
                'NOT_WEARING': 0.01 // 1% not wearing
            },
            'DANGER': {
                'NORMAL': 0.10,    // 10% recover to normal
                'WARNING': 0.50,   // 50% improve to warning
                'DANGER': 0.39,    // 39% stay danger
                'NOT_WEARING': 0.01 // 1% not wearing
            },
            'NOT_WEARING': {
                'NORMAL': 0.70,    // 70% put back on (normal)
                'WARNING': 0.15,   // 15% put back on (warning)
                'DANGER': 0.05,    // 5% put back on (danger)
                'NOT_WEARING': 0.10 // 10% stay not wearing
            }
        };

        const probs = transitions[currentStatus] || transitions['NORMAL'];
        const random = Math.random();
        let cumulative = 0;

        for (const [status, probability] of Object.entries(probs)) {
            cumulative += probability;
            if (random <= cumulative) {
                return status;
            }
        }

        return 'NORMAL';
    }

    /**
     * Force a specific status for an elder (for testing)
     */
    setElderStatus(elderUID, status) {
        if (!this.elderSimulationStates.has(elderUID)) {
            this.elderSimulationStates.set(elderUID, {
                currentStatus: status,
                statusChangeCounter: 0,
                statusChangeProbability: 0.1,
            });
        } else {
            this.elderSimulationStates.get(elderUID).currentStatus = status;
        }
        
        // Generate data immediately
        this.generateDataForElder(elderUID);
    }

    /**
     * Get simulation status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            updateInterval: this.updateInterval,
            activeElders: dataStore.getAllElders().filter(e => e.isActive).length,
            simulationStates: Array.from(this.elderSimulationStates.entries()).map(([uid, state]) => ({
                elderUID: uid,
                elderName: dataStore.getUser(uid)?.name,
                currentStatus: state.currentStatus,
                statusChanges: state.statusChangeCounter,
            })),
        };
    }
}

// Singleton instance
const simulationService = new SimulationService();

module.exports = simulationService;
