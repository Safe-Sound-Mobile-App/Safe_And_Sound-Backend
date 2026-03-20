/**
 * Trigger Controller
 * Orchestrates the full pipeline for a manual status trigger:
 *   1. Generate mock sensor data (dataGenerator)
 *   2. Run TFLite LSTM inference locally (tfliteService)
 *   3. Single combined write to Firebase healthData/{elderId} (firebaseService)
 */

const fs = require('fs');
const path = require('path');

const { predictFromLabel }   = require('../services/tfliteService');
const { writeHealthData }    = require('../services/firebaseService');

const VALID_STATUSES = ['NORMAL', 'WARNING', 'DANGER', 'NOT_WEARING'];
const STATUS_TO_LABEL = {
    NORMAL:      'Normal',
    WARNING:     'Warning',
    DANGER:      'Danger',
    NOT_WEARING: 'Not_Wearing',
};

function stableSeed(elderId, status) {
    // Deterministic 32-bit seed for reproducible demos.
    const s = `${elderId}:${status}`;
    let hash = 2166136261; // FNV-1a
    for (let i = 0; i < s.length; i++) {
        hash ^= s.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0);
}

function computeWindowStats(window) {
    // window: (200,8) of [acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z, hr, spo2]
    let accMagMax = 0;
    let gyroMagMax = 0;
    let hrMin = Infinity;
    let hrMax = -Infinity;
    let spo2Min = Infinity;
    let spo2Max = -Infinity;

    for (const row of window) {
        const [ax, ay, az, gx, gy, gz, hr, spo2] = row;
        const accMag = Math.sqrt(ax * ax + ay * ay + az * az);
        const gyroMag = Math.sqrt(gx * gx + gy * gy + gz * gz);
        if (accMag > accMagMax) accMagMax = accMag;
        if (gyroMag > gyroMagMax) gyroMagMax = gyroMag;
        if (hr < hrMin) hrMin = hr;
        if (hr > hrMax) hrMax = hr;
        if (spo2 < spo2Min) spo2Min = spo2;
        if (spo2 > spo2Max) spo2Max = spo2;
    }

    // Replace Infinity when window is empty (shouldn't happen)
    return {
        accMagMax: Number.isFinite(accMagMax) ? accMagMax : null,
        gyroMagMax: Number.isFinite(gyroMagMax) ? gyroMagMax : null,
        hrMin: Number.isFinite(hrMin) ? hrMin : null,
        hrMax: Number.isFinite(hrMax) ? hrMax : null,
        spo2Min: Number.isFinite(spo2Min) ? spo2Min : null,
        spo2Max: Number.isFinite(spo2Max) ? spo2Max : null,
    };
}

function computeGyroFallHeuristicB(window) {
    // Gyro-only heuristic inspired by real fall kinematics:
    // - short sharp rotation spike (high gyro magnitude)
    // - peak occurs in the middle (not at edges)
    // - then post-peak gyro drops back (stillness)
    //
    // window columns: [acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z, hr, spo2]
    // NOTE: Tuned to your training-generator distribution.
    // In your logs so far, Danger windows rarely exceed gyroPeak >= 250 and
    // spikeCount >= 8, so the previous thresholds made isFall always false.
    const THRESH_PEAK = 180; // deg/s magnitude
    const THRESH_SPIKE = 180; // deg/s magnitude for counting spikes
    const THRESH_SPIKE_COUNT = 3; // samples above threshold (~0.06s @ 50Hz)
    const THRESH_POST_MEAN = 90; // deg/s magnitude after impact
    const PEAK_INDEX_MIN = 50; // avoid spurious peaks near window edges
    const PEAK_INDEX_MAX = 160;

    const gyroMag = new Array(window.length);
    let peak = -Infinity;
    let peakIndex = -1;
    let spikeCount = 0;

    for (let i = 0; i < window.length; i++) {
        const row = window[i];
        const gx = row[3];
        const gy = row[4];
        const gz = row[5];
        const mag = Math.sqrt(gx * gx + gy * gy + gz * gz);
        gyroMag[i] = mag;

        if (mag >= THRESH_SPIKE) spikeCount++;
        if (mag > peak) {
            peak = mag;
            peakIndex = i;
        }
    }

    if (peakIndex < 0) {
        return {
            isFall: false,
            gyroMagMax: null,
            gyroPeak: null,
            peakIndex: null,
            spikeCount: null,
            postMeanAfterPeak: null,
        };
    }

    const afterPeakStart = Math.min(peakIndex + 10, window.length - 1); // skip impact sample neighborhood
    let sum = 0;
    let count = 0;
    for (let i = afterPeakStart; i < window.length; i++) {
        sum += gyroMag[i];
        count++;
    }
    const postMeanAfterPeak = count > 0 ? sum / count : null;

    const meets =
        peak >= THRESH_PEAK &&
        spikeCount >= THRESH_SPIKE_COUNT &&
        peakIndex >= PEAK_INDEX_MIN &&
        peakIndex <= PEAK_INDEX_MAX &&
        (postMeanAfterPeak != null ? postMeanAfterPeak <= THRESH_POST_MEAN : false);

    return {
        isFallCandidate: meets,
        gyroMagMax: peak,
        gyroPeak: peak,
        peakIndex,
        spikeCount,
        postMeanAfterPeak,
        thresholds: {
            THRESH_PEAK,
            THRESH_SPIKE,
            THRESH_SPIKE_COUNT,
            THRESH_POST_MEAN,
            PEAK_INDEX_MIN,
            PEAK_INDEX_MAX,
        },
    };
}

function appendSummaryLog(entry) {
    const LOG_PATH = path.join(__dirname, '../../logs/trigger_ai_summary.jsonl');
    const LOG_DIR = path.dirname(LOG_PATH);

    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n', { encoding: 'utf8' });
}

function windowToSensorPayload(elderId, normalizedStatus, window, isFall) {
    // window: (200,8) rows of [acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z, hr, spo2]
    const last = window[window.length - 1] || [0,0,0,0,0,0,0,0];
    const [accX, accY, accZ, gyroX, gyroY, gyroZ, hr, spo2] = last;

    // Provide additional fields (temp/stress/steps) for dashboard visuals.
    const extraByStatus = {
        NORMAL:      { temperature: 36.8, stress: 30, steps: 3200 },
        WARNING:     { temperature: 37.4, stress: 65, steps: 1400 },
        DANGER:      { temperature: 38.4, stress: 90, steps: 250 },
        NOT_WEARING: { temperature: null, stress: 0,  steps: 0 },
    };
    const extra = extraByStatus[normalizedStatus] || extraByStatus.NORMAL;

    const wearState = normalizedStatus === 'NOT_WEARING' ? 0 : 1;

    return {
        userId: elderId,
        timestamp: Date.now(),
        vitals: {
            heartRate: wearState ? Math.round(hr) : null,
            bloodOxygen: wearState ? Math.round(spo2) : null,
            spo2: wearState ? Math.round(spo2) : null,
            temperature: extra.temperature,
            bloodPressure: { systolic: null, diastolic: null },
        },
        motion: {
            gyro: { x: +gyroX.toFixed(2), y: +gyroY.toFixed(2), z: +gyroZ.toFixed(2) },
            accelerometer: { x: +accX.toFixed(2), y: +accY.toFixed(2), z: +accZ.toFixed(2) },
        },
        activity: {
            steps: extra.steps,
            calories: Math.round(extra.steps * 0.04),
            stress: extra.stress,
        },
        device: {
            wearState,
            batteryLevel: 85,
        },
        health: {
            status: normalizedStatus,
            isFall: !!isFall,
            alerts: [],
        },
        receivedAt: new Date().toISOString(),
        // Extra debug field for demo/validation
        windowPreview: {
            first: window[0],
            last: window[window.length - 1],
        },
    };
}

/**
 * POST /api/trigger/:elderId
 * Body: { status: "NORMAL" | "WARNING" | "DANGER" | "NOT_WEARING" }
 */
exports.triggerStatus = async (req, res) => {
    try {
        const { elderId } = req.params;
        const { status }  = req.body;
        // Optional: client can provide an explicit seed for reproducibility.
        const { seed: clientSeed } = req.body || {};

        if (!status) {
            return res.status(400).json({
                success: false,
                error: `"status" field is required. Valid values: ${VALID_STATUSES.join(', ')}`,
            });
        }

        const normalizedStatus = status.toString().toUpperCase();

        if (!VALID_STATUSES.includes(normalizedStatus)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status "${status}". Valid values: ${VALID_STATUSES.join(', ')}`,
            });
        }

        console.log(`\n🎯 Trigger: [${normalizedStatus}] → elder ${elderId}`);

        // ── Step 1: Generate an in-distribution 200×8 window + run inference ───
        const label = STATUS_TO_LABEL[normalizedStatus];
        const baseSeed = stableSeed(elderId, normalizedStatus);
        // Make each click produce a different (still training-distribution) window.
        // If client provides seed, we keep it deterministic for debugging.
        const nonce = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
        const seed = (clientSeed != null ? (clientSeed >>> 0) : (baseSeed ^ nonce)) >>> 0;

        console.log(`   🧪 Generating training-distribution window (${label}) seed=${seed}...`);
        console.log(`   🤖 Running TFLite inference on full window...`);

        const { aiPrediction, window } = await predictFromLabel(label, seed);
        console.log(`   ✅ AI result: ${aiPrediction.status} (${(aiPrediction.confidence * 100).toFixed(1)}%)`);

        // ── Step 2b: Gyro-based fall heuristic (B case) ────────────────────
        // B case: compute falls only when AI predicts Danger.
        let fallMetrics = {
            isFall: false,
            gyroPeak: null,
            peakIndex: null,
            spikeCount: null,
            postMeanAfterPeak: null,
        };

        if (aiPrediction?.status === 'Danger') {
            const gyroHeuristic = computeGyroFallHeuristicB(window);
            fallMetrics = {
                isFall: !!gyroHeuristic.isFallCandidate,
                gyroPeak: gyroHeuristic.gyroPeak,
                peakIndex: gyroHeuristic.peakIndex,
                spikeCount: gyroHeuristic.spikeCount,
                postMeanAfterPeak: gyroHeuristic.postMeanAfterPeak,
                thresholds: gyroHeuristic.thresholds,
            };
        }

        // ── Step 2: Build a dashboard-friendly payload from the window ─────────
        const sensorPayload = windowToSensorPayload(elderId, normalizedStatus, window, fallMetrics.isFall);

        // ── Step 3: Append expected vs AI summary log (JSONL) ────────────────
        // Expected outcome is the button label (Normal/Warning/Danger/Not_Wearing)
        // AI outcome is aiPrediction.status
        const mismatch = aiPrediction?.status !== label;
        appendSummaryLog({
            timestamp: new Date().toISOString(),
            elderId,
            expected: {
                buttonStatus: normalizedStatus,
                label,
            },
            ai: {
                status: aiPrediction?.status ?? null,
                confidence: aiPrediction?.confidence ?? null,
                scores: aiPrediction?.scores ?? null,
            },
            seed,
            mismatch,
            windowStats: computeWindowStats(window),
            fall: fallMetrics,
        });

        // ── Step 3: Single combined Firebase write ─────────────────────────────
        await writeHealthData(elderId, sensorPayload, aiPrediction);
        console.log(`   💾 Written to healthData/${elderId}`);

        res.json({
            success:         true,
            elderId,
            requestedStatus: normalizedStatus,
            aiPrediction,
            sensorPayload,
        });

    } catch (error) {
        console.error('❌ Trigger error:', error.message);
        res.status(500).json({
            success: false,
            error:   'Failed to process trigger',
            message: error.message,
        });
    }
};
