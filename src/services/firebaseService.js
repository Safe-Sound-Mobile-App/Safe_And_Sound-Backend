/**
 * Firebase Admin SDK Service
 * Handles all Firestore read/write operations for the backend dashboard.
 * The Admin SDK bypasses all Firestore security rules — full unrestricted access.
 */

require('dotenv').config();
const admin = require('firebase-admin');
const path  = require('path');

// Initialise once (guard against hot-reload double-init)
if (!admin.apps.length) {
    const credentialPath = process.env.FIREBASE_CREDENTIAL_PATH
        || './firebase/safe-and-sound-ske19-firebase-adminsdk-fbsvc-1603b9639a.json';

    const serviceAccount = require(path.resolve(credentialPath));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    console.log('🔥 Firebase Admin SDK initialised');
}

const db = admin.firestore();

// ─────────────────────────────────────────────
// ELDERS
// ─────────────────────────────────────────────

/**
 * Fetch all users where role == 'elder' from Firebase.
 * Returns array of { id, firstName, lastName, email, photoURL, isActive, ... }
 */
async function getElders() {
    const snapshot = await db.collection('users')
        .where('role', '==', 'elder')
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Fetch all elders together with their latest healthData document.
 * Returns array of { elder, latestHealthData }
 */
async function getEldersWithHealthData() {
    const elders = await getElders();

    const healthPromises = elders.map(elder =>
        db.collection('healthData').doc(elder.id).get()
            .then(doc => ({ elderId: elder.id, healthData: doc.exists ? doc.data() : null }))
            .catch(() => ({ elderId: elder.id, healthData: null }))
    );

    const healthResults = await Promise.all(healthPromises);
    const healthMap = {};
    healthResults.forEach(({ elderId, healthData }) => {
        healthMap[elderId] = healthData;
    });

    return elders.map(elder => ({
        elder,
        latestHealthData: healthMap[elder.id] || null,
    }));
}

// ─────────────────────────────────────────────
// HEALTH DATA
// ─────────────────────────────────────────────

/**
 * Single combined write to healthData/{elderId}.
 * Uses set + merge: true — creates the document if it doesn't exist, updates if it does.
 * Never touches the existing 'records' subcollection.
 *
 * @param {string} elderId
 * @param {object} sensorPayload  — full HealthData.toJSON() output
 * @param {object} aiPrediction   — { status, confidence, scores }
 */
async function writeHealthData(elderId, sensorPayload, aiPrediction) {
    await db.collection('healthData').doc(elderId).set({
        elderId,
        sensorPayload,
        aiPrediction,
        triggeredAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt:   admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}

/**
 * Read the latest healthData document for a single elder.
 * Returns null if the document doesn't exist (never been triggered).
 */
async function getHealthData(elderId) {
    const doc = await db.collection('healthData').doc(elderId).get();
    return doc.exists ? doc.data() : null;
}

module.exports = {
    db,
    admin,
    getElders,
    getEldersWithHealthData,
    writeHealthData,
    getHealthData,
};
