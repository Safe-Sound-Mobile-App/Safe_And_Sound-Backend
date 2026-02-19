/**
 * HealthData Model
 * Defines the structure and validation for health vitals data
 */

class HealthData {
    constructor(data = {}) {
        this.userId = data.userId || data.elderUID || 'user_default'; // Support both userId and elderUID
        this.timestamp = data.timestamp || Date.now();
        
        // Vital signs
        this.heartRate = data.heartRate || null;
        this.bloodOxygen = data.bloodOxygen || data.spo2 || null; // SpO2 percentage
        this.spo2 = data.spo2 || data.bloodOxygen || null; // Alias for bloodOxygen
        this.temperature = data.temperature || null; // Body temperature in Celsius
        this.bloodPressure = data.bloodPressure || { systolic: null, diastolic: null };
        
        // Motion sensors
        this.gyro = data.gyro || { x: 0, y: 0, z: 0 };
        this.accelerometer = data.accelerometer || { x: 0, y: 0, z: 0 };
        
        // Activity metrics
        this.steps = data.steps || 0;
        this.calories = data.calories || 0;
        this.stress = data.stress || 0;
        
        // Device status
        this.wearState = data.wearState !== undefined ? data.wearState : 1; // 0 = not worn, 1 = worn
        this.batteryLevel = data.batteryLevel || 100;
        
        // Health status (calculated)
        this.status = data.status || 'NORMAL'; // NORMAL, WARNING, DANGER, NOT_WEARING
        this.alerts = data.alerts || [];
        
        // Metadata
        this.receivedAt = new Date().toISOString();
    }

    /**
     * Validate health data integrity
     */
    isValid() {
        return (
            this.heartRate !== null ||
            this.spo2 !== null ||
            this.wearState !== null
        );
    }

    /**
     * Convert to plain object for JSON response
     */
    toJSON() {
        return {
            userId: this.userId,
            timestamp: this.timestamp,
            vitals: {
                heartRate: this.heartRate,
                bloodOxygen: this.bloodOxygen,
                spo2: this.spo2,
                temperature: this.temperature,
                bloodPressure: this.bloodPressure,
            },
            motion: {
                gyro: this.gyro,
                accelerometer: this.accelerometer,
            },
            activity: {
                steps: this.steps,
                calories: this.calories,
                stress: this.stress,
            },
            device: {
                wearState: this.wearState,
                batteryLevel: this.batteryLevel,
            },
            health: {
                status: this.status,
                alerts: this.alerts,
            },
            receivedAt: this.receivedAt,
        };
    }
}

module.exports = HealthData;
