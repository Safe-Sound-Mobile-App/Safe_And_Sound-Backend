/**
 * Data Store Service
 * Manages in-memory storage for users and health records
 */

const User = require('../models/User');
const ElderHealthRecord = require('../models/ElderHealthRecord');

class DataStore {
    constructor() {
        // User storage
        this.users = new Map(); // uid -> User
        
        // Health records storage
        this.elderHealthRecords = new Map(); // elderUID -> Array of ElderHealthRecord
        this.latestHealthData = new Map(); // elderUID -> ElderHealthRecord (most recent)
        
        // Configuration
        this.maxRecordsPerElder = 100;
    }

    // ========== USER MANAGEMENT ==========

    /**
     * Add or update user
     */
    saveUser(user) {
        if (!(user instanceof User)) {
            user = new User(user);
        }
        this.users.set(user.uid, user);
        return user;
    }

    /**
     * Get user by UID
     */
    getUser(uid) {
        return this.users.get(uid);
    }

    /**
     * Get all users
     */
    getAllUsers() {
        return Array.from(this.users.values());
    }

    /**
     * Get all elders
     */
    getAllElders() {
        return this.getAllUsers().filter(user => user.isElder());
    }

    /**
     * Get all caregivers
     */
    getAllCaregivers() {
        return this.getAllUsers().filter(user => user.isCaregiver());
    }

    /**
     * Get elders assigned to a caregiver
     */
    getEldersForCaregiver(caregiverUID) {
        const caregiver = this.getUser(caregiverUID);
        if (!caregiver || !caregiver.isCaregiver()) {
            return [];
        }
        return caregiver.elderUIDs
            .map(uid => this.getUser(uid))
            .filter(user => user !== undefined);
    }

    /**
     * Delete user
     */
    deleteUser(uid) {
        this.users.delete(uid);
        this.elderHealthRecords.delete(uid);
        this.latestHealthData.delete(uid);
    }

    // ========== HEALTH RECORD MANAGEMENT ==========

    /**
     * Save health record for an elder
     */
    saveHealthRecord(elderUID, healthData) {
        // Verify elder exists
        const elder = this.getUser(elderUID);
        if (!elder || !elder.isElder()) {
            throw new Error(`Elder with UID ${elderUID} not found`);
        }

        const record = new ElderHealthRecord(elderUID, healthData);

        // Initialize array if needed
        if (!this.elderHealthRecords.has(elderUID)) {
            this.elderHealthRecords.set(elderUID, []);
        }

        // Add record
        const records = this.elderHealthRecords.get(elderUID);
        records.push(record);

        // Limit records
        if (records.length > this.maxRecordsPerElder) {
            records.shift(); // Remove oldest
        }

        // Update latest
        this.latestHealthData.set(elderUID, record);

        return record;
    }

    /**
     * Get latest health data for an elder
     */
    getLatestHealthData(elderUID) {
        return this.latestHealthData.get(elderUID);
    }

    /**
     * Get health history for an elder
     */
    getHealthHistory(elderUID, limit = 10) {
        const records = this.elderHealthRecords.get(elderUID);
        if (!records) return [];
        
        return records.slice(-limit).reverse();
    }

    /**
     * Get all health records for an elder
     */
    getAllHealthRecords(elderUID) {
        return this.elderHealthRecords.get(elderUID) || [];
    }

    /**
     * Get latest health data for all elders
     */
    getAllLatestHealthData() {
        const results = [];
        for (const [elderUID, record] of this.latestHealthData.entries()) {
            const elder = this.getUser(elderUID);
            if (elder && elder.isActive) {
                results.push({
                    elder: elder.toJSON(),
                    healthData: record.toJSON(),
                });
            }
        }
        return results;
    }

    /**
     * Get statistics for an elder
     */
    getElderStats(elderUID) {
        const records = this.getAllHealthRecords(elderUID);
        if (records.length === 0) {
            return null;
        }

        const healthDataArray = records.map(r => r.healthData);
        
        // Count by status
        const byStatus = {
            NORMAL: healthDataArray.filter(d => d.status === 'NORMAL').length,
            WARNING: healthDataArray.filter(d => d.status === 'WARNING').length,
            DANGER: healthDataArray.filter(d => d.status === 'DANGER').length,
            NOT_WEARING: healthDataArray.filter(d => d.status === 'NOT_WEARING').length,
        };

        // Calculate averages
        const averages = {
            heartRate: this._calculateAverage(healthDataArray, 'heartRate'),
            spo2: this._calculateAverage(healthDataArray, 'spo2'),
            temperature: this._calculateAverage(healthDataArray, 'temperature'),
            stress: this._calculateAverage(healthDataArray, 'stress'),
        };

        return {
            elderUID,
            total: records.length,
            byStatus,
            averages,
            latest: this.latestHealthData.get(elderUID)?.toJSON(),
        };
    }

    /**
     * Get statistics for all elders
     */
    getAllEldersStats() {
        const elders = this.getAllElders();
        return elders.map(elder => this.getElderStats(elder.uid)).filter(stat => stat !== null);
    }

    /**
     * Clear all health records for an elder
     */
    clearElderHealthRecords(elderUID) {
        this.elderHealthRecords.delete(elderUID);
        this.latestHealthData.delete(elderUID);
    }

    /**
     * Clear all data
     */
    clearAll() {
        this.users.clear();
        this.elderHealthRecords.clear();
        this.latestHealthData.clear();
    }

    // ========== HELPER METHODS ==========

    _calculateAverage(dataArray, field) {
        const values = dataArray
            .map(d => d[field])
            .filter(v => v !== null && v !== undefined);
        if (values.length === 0) return null;
        const sum = values.reduce((a, b) => a + b, 0);
        return (sum / values.length).toFixed(2);
    }

    /**
     * Get store summary
     */
    getSummary() {
        return {
            totalUsers: this.users.size,
            totalElders: this.getAllElders().length,
            totalCaregivers: this.getAllCaregivers().length,
            eldersWithData: this.latestHealthData.size,
            totalHealthRecords: Array.from(this.elderHealthRecords.values())
                .reduce((sum, records) => sum + records.length, 0),
        };
    }
}

// Singleton instance
const dataStore = new DataStore();

module.exports = dataStore;
