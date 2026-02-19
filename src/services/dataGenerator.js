/**
 * Data Generator Service
 * Generates realistic health data for testing and simulation
 */

const HealthData = require('../models/HealthData');

// Status thresholds
const THRESHOLDS = {
    HEART_RATE: {
        MIN_NORMAL: 60,
        MAX_NORMAL: 100,
        MIN_WARNING: 50,
        MAX_WARNING: 120,
        MIN_DANGER: 40,
        MAX_DANGER: 150,
    },
    SPO2: {
        MIN_NORMAL: 95,
        MIN_WARNING: 90,
        MIN_DANGER: 85,
    },
    TEMPERATURE: {
        MIN_NORMAL: 36.1,
        MAX_NORMAL: 37.2,
        MIN_WARNING: 35.5,
        MAX_WARNING: 38.0,
        MIN_DANGER: 35.0,
        MAX_DANGER: 39.0,
    },
    BLOOD_PRESSURE: {
        SYSTOLIC_MAX_NORMAL: 120,
        DIASTOLIC_MAX_NORMAL: 80,
        SYSTOLIC_MAX_WARNING: 140,
        DIASTOLIC_MAX_WARNING: 90,
    },
};

/**
 * Generate random value within a range
 */
function randomInRange(min, max, decimals = 0) {
    const value = Math.random() * (max - min) + min;
    return decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.round(value);
}

/**
 * Generate health data based on specified status
 */
function generateByStatus(status = 'NORMAL', userId = 'user_test') {
    let data = {
        userId,
        timestamp: Date.now(),
    };

    switch (status.toUpperCase()) {
        case 'NOT_WEARING':
            data.wearState = 0;
            data.heartRate = null;
            data.spo2 = null;
            data.temperature = null;
            data.bloodPressure = { systolic: null, diastolic: null };
            data.gyro = { x: 0, y: 0, z: 0 };
            data.accelerometer = { x: 0, y: 0, z: 0 };
            data.steps = 0;
            data.stress = 0;
            data.status = 'NOT_WEARING';
            data.alerts = ['Device not being worn'];
            break;

        case 'DANGER':
            data.wearState = 1;
            data.heartRate = Math.random() > 0.5 
                ? randomInRange(THRESHOLDS.HEART_RATE.MIN_DANGER, THRESHOLDS.HEART_RATE.MIN_WARNING)
                : randomInRange(THRESHOLDS.HEART_RATE.MAX_WARNING, THRESHOLDS.HEART_RATE.MAX_DANGER);
            data.spo2 = randomInRange(THRESHOLDS.SPO2.MIN_DANGER, THRESHOLDS.SPO2.MIN_WARNING);
            data.temperature = Math.random() > 0.5
                ? randomInRange(THRESHOLDS.TEMPERATURE.MIN_DANGER, THRESHOLDS.TEMPERATURE.MIN_WARNING, 1)
                : randomInRange(THRESHOLDS.TEMPERATURE.MAX_WARNING, THRESHOLDS.TEMPERATURE.MAX_DANGER, 1);
            data.bloodPressure = {
                systolic: randomInRange(THRESHOLDS.BLOOD_PRESSURE.SYSTOLIC_MAX_WARNING, 180),
                diastolic: randomInRange(THRESHOLDS.BLOOD_PRESSURE.DIASTOLIC_MAX_WARNING, 110),
            };
            data.gyro = {
                x: randomInRange(-20, 20, 2),
                y: randomInRange(-20, 20, 2),
                z: randomInRange(-20, 20, 2),
            };
            data.accelerometer = {
                x: randomInRange(-15, 15, 2),
                y: randomInRange(-15, 15, 2),
                z: randomInRange(-15, 15, 2),
            };
            data.steps = randomInRange(100, 500);
            data.stress = randomInRange(80, 100);
            data.status = 'DANGER';
            data.alerts = [
                'Critical heart rate detected',
                'Low blood oxygen levels',
                'High stress detected',
            ];
            break;

        case 'WARNING':
            data.wearState = 1;
            data.heartRate = Math.random() > 0.5
                ? randomInRange(THRESHOLDS.HEART_RATE.MIN_WARNING, THRESHOLDS.HEART_RATE.MIN_NORMAL)
                : randomInRange(THRESHOLDS.HEART_RATE.MAX_NORMAL, THRESHOLDS.HEART_RATE.MAX_WARNING);
            data.spo2 = randomInRange(THRESHOLDS.SPO2.MIN_WARNING, THRESHOLDS.SPO2.MIN_NORMAL);
            data.temperature = Math.random() > 0.5
                ? randomInRange(THRESHOLDS.TEMPERATURE.MIN_WARNING, THRESHOLDS.TEMPERATURE.MIN_NORMAL, 1)
                : randomInRange(THRESHOLDS.TEMPERATURE.MAX_NORMAL, THRESHOLDS.TEMPERATURE.MAX_WARNING, 1);
            data.bloodPressure = {
                systolic: randomInRange(THRESHOLDS.BLOOD_PRESSURE.SYSTOLIC_MAX_NORMAL, THRESHOLDS.BLOOD_PRESSURE.SYSTOLIC_MAX_WARNING),
                diastolic: randomInRange(THRESHOLDS.BLOOD_PRESSURE.DIASTOLIC_MAX_NORMAL, THRESHOLDS.BLOOD_PRESSURE.DIASTOLIC_MAX_WARNING),
            };
            data.gyro = {
                x: randomInRange(-10, 10, 2),
                y: randomInRange(-10, 10, 2),
                z: randomInRange(-10, 10, 2),
            };
            data.accelerometer = {
                x: randomInRange(-8, 8, 2),
                y: randomInRange(-8, 8, 2),
                z: randomInRange(-8, 8, 2),
            };
            data.steps = randomInRange(1000, 3000);
            data.stress = randomInRange(60, 79);
            data.status = 'WARNING';
            data.alerts = ['Elevated heart rate', 'Monitor vitals closely'];
            break;

        case 'NORMAL':
        default:
            data.wearState = 1;
            data.heartRate = randomInRange(THRESHOLDS.HEART_RATE.MIN_NORMAL, THRESHOLDS.HEART_RATE.MAX_NORMAL);
            data.spo2 = randomInRange(THRESHOLDS.SPO2.MIN_NORMAL, 100);
            data.temperature = randomInRange(THRESHOLDS.TEMPERATURE.MIN_NORMAL, THRESHOLDS.TEMPERATURE.MAX_NORMAL, 1);
            data.bloodPressure = {
                systolic: randomInRange(90, THRESHOLDS.BLOOD_PRESSURE.SYSTOLIC_MAX_NORMAL),
                diastolic: randomInRange(60, THRESHOLDS.BLOOD_PRESSURE.DIASTOLIC_MAX_NORMAL),
            };
            data.gyro = {
                x: randomInRange(-5, 5, 2),
                y: randomInRange(-5, 5, 2),
                z: randomInRange(-5, 5, 2),
            };
            data.accelerometer = {
                x: randomInRange(-3, 3, 2),
                y: randomInRange(-3, 3, 2),
                z: randomInRange(-3, 3, 2),
            };
            data.steps = randomInRange(3000, 8000);
            data.stress = randomInRange(10, 59);
            data.status = 'NORMAL';
            data.alerts = [];
            break;
    }

    // Common fields
    data.calories = Math.round(data.steps * 0.04);
    data.batteryLevel = randomInRange(20, 100);

    return new HealthData(data);
}

/**
 * Generate random health data (random status)
 */
function generateRandom(userId = 'user_test') {
    const statuses = ['NORMAL', 'WARNING', 'DANGER', 'NOT_WEARING'];
    const weights = [0.7, 0.2, 0.08, 0.02]; // 70% normal, 20% warning, 8% danger, 2% not wearing
    
    let random = Math.random();
    let status = 'NORMAL';
    let cumulative = 0;
    
    for (let i = 0; i < statuses.length; i++) {
        cumulative += weights[i];
        if (random <= cumulative) {
            status = statuses[i];
            break;
        }
    }
    
    return generateByStatus(status, userId);
}

module.exports = {
    generateByStatus,
    generateRandom,
    THRESHOLDS,
};
