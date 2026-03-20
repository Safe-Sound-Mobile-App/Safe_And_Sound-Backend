/**
 * Auto Simulation Service
 * Starts/stops per-elder intervals which trigger the same pipeline as:
 * POST /api/trigger/:elderId
 *
 * Requirements:
 * - One toggle button per elder
 * - Every 1 minute
 * - Random states: NORMAL/WARNING/DANGER (exclude NOT_WEARING)
 */

const triggerController = require('../controllers/triggerController');

const TICK_MS = 60 * 1000;
const RANDOM_STATUSES = ['NORMAL', 'WARNING', 'DANGER'];

// elderId -> intervalId
const intervals = new Map();
// elderId -> boolean (prevent overlapping inference)
const inFlight = new Map();

async function runTick(elderId) {
    if (inFlight.get(elderId)) return;
    inFlight.set(elderId, true);

    const status = RANDOM_STATUSES[Math.floor(Math.random() * RANDOM_STATUSES.length)];

    // Call the existing trigger controller pipeline directly.
    // Provide a minimal mock res; triggerController will write to Firebase + logs anyway.
    const req = { params: { elderId }, body: { status } };
    const res = {
        json: () => {},
        status: () => ({ json: () => {} }),
    };

    try {
        await triggerController.triggerStatus(req, res);
    } catch (err) {
        console.error(`❌ Auto tick failed for elder=${elderId}:`, err?.message || err);
    } finally {
        inFlight.set(elderId, false);
    }
}

function startForElder(elderId) {
    if (intervals.has(elderId)) return { running: true };

    // Start immediately, then every minute
    runTick(elderId);

    const intervalId = setInterval(() => {
        runTick(elderId);
    }, TICK_MS);

    intervals.set(elderId, intervalId);
    return { running: true };
}

function stopForElder(elderId) {
    const intervalId = intervals.get(elderId);
    if (intervalId) clearInterval(intervalId);
    intervals.delete(elderId);
    return { running: false };
}

function getStatus() {
    const running = {};
    for (const elderId of intervals.keys()) {
        running[elderId] = true;
    }
    return { running };
}

module.exports = {
    startForElder,
    stopForElder,
    getStatus,
};

