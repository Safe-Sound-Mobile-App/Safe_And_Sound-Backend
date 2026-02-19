/**
 * Elder Health Record Model
 * Links health data to a specific elder
 */

const HealthData = require('./HealthData');

class ElderHealthRecord {
    constructor(elderUID, healthData) {
        this.elderUID = elderUID;
        this.healthData = healthData instanceof HealthData ? healthData : new HealthData(healthData);
        this.recordId = this.generateRecordId();
    }

    /**
     * Generate unique record ID
     */
    generateRecordId() {
        return `record_${this.elderUID}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            recordId: this.recordId,
            elderUID: this.elderUID,
            healthData: this.healthData.toJSON(),
        };
    }
}

module.exports = ElderHealthRecord;
