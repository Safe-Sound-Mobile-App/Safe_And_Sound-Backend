/**
 * Status Calculator Service
 * Determines health status based on vitals data
 */

const { THRESHOLDS } = require('./dataGenerator');

/**
 * Calculate health status from vitals
 */
function calculateStatus(healthData) {
    // Check if device is being worn
    if (healthData.wearState === 0 || healthData.wearState === false) {
        return {
            status: 'NOT_WEARING',
            alerts: ['Device not being worn'],
            severity: 0,
        };
    }

    const alerts = [];
    let dangerCount = 0;
    let warningCount = 0;

    // Check Heart Rate
    if (healthData.heartRate !== null) {
        if (
            healthData.heartRate < THRESHOLDS.HEART_RATE.MIN_DANGER ||
            healthData.heartRate > THRESHOLDS.HEART_RATE.MAX_DANGER
        ) {
            alerts.push('Critical heart rate detected');
            dangerCount++;
        } else if (
            healthData.heartRate < THRESHOLDS.HEART_RATE.MIN_WARNING ||
            healthData.heartRate > THRESHOLDS.HEART_RATE.MAX_WARNING
        ) {
            alerts.push('Elevated heart rate');
            warningCount++;
        }
    }

    // Check SpO2 (Blood Oxygen)
    if (healthData.spo2 !== null) {
        if (healthData.spo2 < THRESHOLDS.SPO2.MIN_DANGER) {
            alerts.push('Critically low blood oxygen levels');
            dangerCount++;
        } else if (healthData.spo2 < THRESHOLDS.SPO2.MIN_WARNING) {
            alerts.push('Low blood oxygen levels');
            warningCount++;
        }
    }

    // Check Temperature
    if (healthData.temperature !== null) {
        if (
            healthData.temperature < THRESHOLDS.TEMPERATURE.MIN_DANGER ||
            healthData.temperature > THRESHOLDS.TEMPERATURE.MAX_DANGER
        ) {
            alerts.push('Abnormal body temperature');
            dangerCount++;
        } else if (
            healthData.temperature < THRESHOLDS.TEMPERATURE.MIN_WARNING ||
            healthData.temperature > THRESHOLDS.TEMPERATURE.MAX_WARNING
        ) {
            alerts.push('Elevated temperature');
            warningCount++;
        }
    }

    // Check Blood Pressure
    if (healthData.bloodPressure && healthData.bloodPressure.systolic) {
        if (
            healthData.bloodPressure.systolic > THRESHOLDS.BLOOD_PRESSURE.SYSTOLIC_MAX_WARNING ||
            healthData.bloodPressure.diastolic > THRESHOLDS.BLOOD_PRESSURE.DIASTOLIC_MAX_WARNING
        ) {
            alerts.push('High blood pressure detected');
            if (healthData.bloodPressure.systolic > 160) {
                dangerCount++;
            } else {
                warningCount++;
            }
        }
    }

    // Check Stress Level
    if (healthData.stress !== null && healthData.stress !== undefined) {
        if (healthData.stress >= 80) {
            alerts.push('High stress detected');
            dangerCount++;
        } else if (healthData.stress >= 60) {
            alerts.push('Elevated stress levels');
            warningCount++;
        }
    }

    // Check Motion (potential fall detection)
    if (healthData.gyro) {
        const highMotion =
            Math.abs(healthData.gyro.x) > 15 ||
            Math.abs(healthData.gyro.y) > 15 ||
            Math.abs(healthData.gyro.z) > 15;
        
        if (highMotion && healthData.steps < 100) {
            alerts.push('Unusual motion detected - possible fall');
            dangerCount++;
        }
    }

    // Determine overall status
    let status = 'NORMAL';
    let severity = 0;

    if (dangerCount > 0) {
        status = 'DANGER';
        severity = 3;
        if (alerts.length === 0) {
            alerts.push('Critical health alert - immediate attention required');
        }
    } else if (warningCount > 0) {
        status = 'WARNING';
        severity = 2;
        if (alerts.length === 0) {
            alerts.push('Monitor vitals closely');
        }
    } else {
        severity = 1;
    }

    return {
        status,
        alerts,
        severity,
        metrics: {
            dangerCount,
            warningCount,
        },
    };
}

/**
 * Get status color for display
 */
function getStatusColor(status) {
    const colors = {
        NORMAL: '#238636',
        WARNING: '#d29922',
        DANGER: '#da3633',
        NOT_WEARING: '#484f58',
    };
    return colors[status] || colors.NORMAL;
}

/**
 * Get status emoji for display
 */
function getStatusEmoji(status) {
    const emojis = {
        NORMAL: '✅',
        WARNING: '⚠️',
        DANGER: '🚨',
        NOT_WEARING: '👕',
    };
    return emojis[status] || '❓';
}

module.exports = {
    calculateStatus,
    getStatusColor,
    getStatusEmoji,
};
