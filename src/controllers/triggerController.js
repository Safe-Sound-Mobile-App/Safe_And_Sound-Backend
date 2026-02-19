/**
 * Trigger Controller
 * Orchestrates the full pipeline for a manual status trigger:
 *   1. Generate mock sensor data (dataGenerator)
 *   2. Run TFLite LSTM inference locally (tfliteService)
 *   3. Single combined write to Firebase healthData/{elderId} (firebaseService)
 */

const { generateByStatus }  = require('../services/dataGenerator');
const { predict }            = require('../services/tfliteService');
const { writeHealthData }    = require('../services/firebaseService');

const VALID_STATUSES = ['NORMAL', 'WARNING', 'DANGER', 'NOT_WEARING'];

/**
 * POST /api/trigger/:elderId
 * Body: { status: "NORMAL" | "WARNING" | "DANGER" | "NOT_WEARING" }
 */
exports.triggerStatus = async (req, res) => {
    try {
        const { elderId } = req.params;
        const { status }  = req.body;

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

        // ── Step 1: Generate mock sensor payload ───────────────────────────────
        const sensorData    = generateByStatus(normalizedStatus, elderId);
        const sensorPayload = sensorData.toJSON();

        // ── Step 2: Run TFLite inference (skip for NOT_WEARING — no valid vitals) ─
        let aiPrediction;

        if (normalizedStatus === 'NOT_WEARING') {
            // Device not worn — no sensor readings, bypass model
            aiPrediction = {
                status:     'Not_Wearing',
                confidence: 1.0,
                scores: {
                    Normal:      0.0,
                    Warning:     0.0,
                    Danger:      0.0,
                    Not_Wearing: 1.0,
                },
            };
            console.log(`   ⏭️  Skipped model (NOT_WEARING)`);
        } else {
            console.log(`   🤖 Running TFLite inference...`);
            aiPrediction = await predict(sensorData);
            console.log(`   ✅ AI result: ${aiPrediction.status} (${(aiPrediction.confidence * 100).toFixed(1)}%)`);
        }

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
