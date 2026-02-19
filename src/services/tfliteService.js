/**
 * TFLite Inference Service
 * Bridges Node.js → Python subprocess to run LSTM fall detection model.
 * Sensor data is passed via stdin (JSON), prediction is returned via stdout (JSON).
 */

require('dotenv').config();
const { spawn } = require('child_process');
const path      = require('path');

const PYTHON_PATH    = process.env.PYTHON_PATH || 'python3';
const PREDICT_SCRIPT = path.join(__dirname, '../../ml/predict.py');

/**
 * Run the TFLite model on a HealthData object.
 *
 * @param {HealthData} healthData — instance from dataGenerator.generateByStatus()
 * @returns {Promise<{ status: string, confidence: number, scores: object }>}
 */
function predict(healthData) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            accelerometer: {
                x: healthData.accelerometer?.x ?? 0,
                y: healthData.accelerometer?.y ?? 0,
                z: healthData.accelerometer?.z ?? 0,
            },
            gyro: {
                x: healthData.gyro?.x ?? 0,
                y: healthData.gyro?.y ?? 0,
                z: healthData.gyro?.z ?? 0,
            },
            heartRate: healthData.heartRate ?? 70,
            spo2:      healthData.spo2      ?? 98,
        });

        const py = spawn(PYTHON_PATH, [PREDICT_SCRIPT]);

        let stdout = '';
        let stderr = '';

        py.stdout.on('data', chunk => { stdout += chunk; });
        py.stderr.on('data', chunk => { stderr += chunk; });

        py.on('close', code => {
            if (code !== 0) {
                const errMsg = stderr.slice(-600) || 'Unknown Python error';
                return reject(new Error(`Python inference failed (exit ${code}): ${errMsg}`));
            }

            // stdout may contain TF log lines before the JSON — find the last JSON object
            const jsonLine = stdout.trim().split('\n').reverse().find(l => l.startsWith('{'));
            if (!jsonLine) {
                return reject(new Error(`No JSON in Python output: ${stdout.slice(0, 300)}`));
            }

            try {
                const result = JSON.parse(jsonLine);
                if (result.error) {
                    return reject(new Error(`Python error: ${result.error}`));
                }
                resolve(result);
            } catch (e) {
                reject(new Error(`Failed to parse Python output: ${jsonLine}`));
            }
        });

        py.on('error', err => {
            reject(new Error(
                `Failed to spawn Python at "${PYTHON_PATH}": ${err.message}\n` +
                `Check PYTHON_PATH in your .env file.`
            ));
        });

        py.stdin.write(payload);
        py.stdin.end();
    });
}

module.exports = { predict };
