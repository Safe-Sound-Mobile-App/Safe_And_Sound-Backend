/**
 * Safe & Sound Backend Application
 * Event-Driven Health Monitoring — Firebase + TFLite LSTM
 * Version 3.0
 */

const express = require('express');
const cors = require('cors');
const app = express();

// Import routes
const healthRoutes      = require('./routes/healthRoutes');
const displayRoutes     = require('./routes/displayRoutes');
const userRoutes        = require('./routes/userRoutes');
const elderHealthRoutes = require('./routes/elderHealthRoutes');
const simulationRoutes  = require('./routes/simulationRoutes');

// New Firebase-backed routes
const elderRoutes   = require('./routes/elderRoutes');
const triggerRoutes = require('./routes/triggerRoutes');
const autoSimRoutes = require('./routes/autoSimRoutes');

// ========== MIDDLEWARE ==========

// CORS Configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning', 'Authorization'],
    credentials: false
}));

// JSON Parser
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n📨 [${req.method}] ${req.url}`);
    console.log(`⏰ ${timestamp}`);
    
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    }
    
    next();
});

// ========== ROUTES ==========

// ── Firebase-backed routes (new) ──────────────────────────────────────────
// Fetch elders from Firebase + health data
app.use('/api/elders', elderRoutes);

// Manual trigger: generate → TFLite inference → Firebase write
app.use('/api/trigger', triggerRoutes);

// ── Legacy in-memory routes (kept for backward compatibility) ─────────────
app.use('/api/users', userRoutes);
app.use('/api/health', elderHealthRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/vitals', healthRoutes);

// Display/Dashboard Routes
app.use('/display', displayRoutes);

// Auto simulation (per-elder)
app.use('/api/auto-sim', autoSimRoutes);

// Root redirect to dashboard
app.get('/', (req, res) => {
    res.redirect('/display/dashboard');
});

// ========== ERROR HANDLING ==========

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.url,
        availableEndpoints: {
            health: {
                generate: 'POST /api/health/generate',
                latest: 'GET /api/health/latest',
                history: 'GET /api/health/history',
                stats: 'GET /api/health/stats',
                sync: 'POST /api/health/sync',
                status: 'GET /api/health/status',
            },
            display: {
                dashboard: 'GET /display/dashboard',
                stats: 'GET /display/stats',
            },
        },
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
    });
});

// ========== STARTUP MESSAGE ==========

console.log('\n🛡️  Safe & Sound Backend v3.0 - Firebase + TFLite Edition');
console.log('🔥 Elders: fetched live from Firebase (users collection, role=elder)');
console.log('🤖 AI: LSTM TFLite model runs locally, single write to healthData');
console.log('✅ Statuses: NORMAL · WARNING · DANGER · NOT_WEARING');
console.log('📍 Dashboard: /display/dashboard\n');

module.exports = app;