/**
 * Display Routes
 * Serves the HTML backend dashboard.
 * Elders are fetched live from Firebase. Each elder card has 4 manual trigger buttons.
 */

const express = require('express');
const router  = express.Router();

/**
 * Main Backend Dashboard
 * GET /display/dashboard
 */
router.get('/dashboard', (req, res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Safe & Sound — Backend Dashboard</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            min-height: 100vh;
            padding: 28px 24px;
            color: #e2e8f0;
        }

        .container { max-width: 1400px; margin: 0 auto; }

        /* ── Header ── */
        header { text-align: center; margin-bottom: 32px; }
        header h1 {
            font-size: 2.2rem; font-weight: 700; letter-spacing: -0.5px;
            background: linear-gradient(90deg, #a78bfa, #60a5fa, #34d399);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            margin-bottom: 6px;
        }
        header p { font-size: 0.9rem; opacity: 0.6; }

        /* ── Summary bar ── */
        .summary {
            display: flex; gap: 12px; flex-wrap: wrap;
            justify-content: center; margin-bottom: 28px;
        }
        .chip {
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 999px; padding: 8px 20px;
            font-size: 0.85rem; font-weight: 600;
            display: flex; align-items: center; gap: 8px;
        }
        .chip .dot {
            width: 10px; height: 10px; border-radius: 50%;
        }
        .dot-normal  { background: #34d399; }
        .dot-warning { background: #fbbf24; }
        .dot-danger  { background: #f87171; }
        .dot-notwear { background: #94a3b8; }
        .dot-total   { background: #a78bfa; }

        /* ── Refresh bar ── */
        .toolbar {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
        }
        .refresh-info { font-size: 0.8rem; opacity: 0.5; }
        .refresh-btn {
            background: rgba(167,139,250,0.2);
            border: 1px solid rgba(167,139,250,0.35);
            color: #a78bfa; padding: 8px 18px; border-radius: 8px;
            cursor: pointer; font-size: 0.85rem; font-weight: 600;
            transition: background 0.15s;
        }
        .refresh-btn:hover { background: rgba(167,139,250,0.35); }

        /* ── Elder grid ── */
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
            gap: 20px;
        }

        /* ── Elder card ── */
        .card {
            background: rgba(255,255,255,0.06);
            border: 1.5px solid rgba(255,255,255,0.1);
            border-radius: 18px; padding: 22px;
            transition: transform 0.2s, border-color 0.3s;
        }
        .card:hover { transform: translateY(-3px); }
        .card.status-Normal      { border-color: rgba(52,211,153,0.45); }
        .card.status-Warning     { border-color: rgba(251,191,36,0.45); }
        .card.status-Danger      { border-color: rgba(248,113,113,0.55); }
        .card.status-Not_Wearing { border-color: rgba(148,163,184,0.35); }
        .card.loading            { opacity: 0.7; pointer-events: none; }

        /* Card header */
        .card-header {
            display: flex; justify-content: space-between;
            align-items: flex-start; margin-bottom: 16px;
        }
        .elder-name { font-size: 1.15rem; font-weight: 700; line-height: 1.3; }
        .elder-id   { font-size: 0.7rem; opacity: 0.45; margin-top: 2px; font-family: monospace; }

        /* Status badge */
        .badge {
            padding: 5px 13px; border-radius: 999px;
            font-size: 0.78rem; font-weight: 700; white-space: nowrap;
            flex-shrink: 0; margin-left: 12px;
        }
        .badge-Normal      { background: rgba(52,211,153,0.2);  color: #34d399; }
        .badge-Warning     { background: rgba(251,191,36,0.2);  color: #fbbf24; }
        .badge-Danger      { background: rgba(248,113,113,0.2); color: #f87171; }
        .badge-Not_Wearing { background: rgba(148,163,184,0.15); color: #94a3b8; }
        .badge-NO_DATA     { background: rgba(255,255,255,0.08); color: #64748b; }

        /* Vitals row */
        .vitals {
            display: grid; grid-template-columns: repeat(4, 1fr);
            gap: 8px; margin-bottom: 16px;
        }
        .vital-box {
            background: rgba(0,0,0,0.25); border-radius: 10px;
            padding: 8px 6px; text-align: center;
        }
        .vital-label { font-size: 0.65rem; opacity: 0.55; margin-bottom: 3px; }
        .vital-value { font-size: 1.05rem; font-weight: 700; }

        /* Confidence bar */
        .confidence-row {
            display: flex; align-items: center; gap: 10px;
            margin-bottom: 16px; font-size: 0.75rem; opacity: 0.6;
        }
        .conf-bar-bg {
            flex: 1; height: 4px; background: rgba(255,255,255,0.1);
            border-radius: 2px; overflow: hidden;
        }
        .conf-bar-fill {
            height: 100%; border-radius: 2px;
            transition: width 0.4s ease;
        }
        .conf-fill-Normal      { background: #34d399; }
        .conf-fill-Warning     { background: #fbbf24; }
        .conf-fill-Danger      { background: #f87171; }
        .conf-fill-Not_Wearing { background: #94a3b8; }

        /* Trigger buttons */
        .btn-row {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
        }
        .btn-trigger {
            border: none; border-radius: 10px; padding: 10px 4px;
            font-size: 0.75rem; font-weight: 700; cursor: pointer;
            transition: transform 0.15s, opacity 0.15s; line-height: 1.3;
        }
        .btn-trigger:hover  { transform: translateY(-2px); }
        .btn-trigger:active { transform: scale(0.97); }
        .btn-trigger:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .btn-normal  { background: rgba(52,211,153,0.2);  color: #34d399;  border: 1px solid rgba(52,211,153,0.4); }
        .btn-warning { background: rgba(251,191,36,0.2);  color: #fbbf24;  border: 1px solid rgba(251,191,36,0.4); }
        .btn-danger  { background: rgba(248,113,113,0.2); color: #f87171;  border: 1px solid rgba(248,113,113,0.4); }
        .btn-notwear { background: rgba(148,163,184,0.15);color: #94a3b8;  border: 1px solid rgba(148,163,184,0.3); }

        .btn-normal:hover  { background: rgba(52,211,153,0.35); }
        .btn-warning:hover { background: rgba(251,191,36,0.35); }
        .btn-danger:hover  { background: rgba(248,113,113,0.35); }
        .btn-notwear:hover { background: rgba(148,163,184,0.28); }

        /* Spinner */
        .spinner {
            display: inline-block; width: 14px; height: 14px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: #a78bfa;
            border-radius: 50%; animation: spin 0.7s linear infinite;
            vertical-align: middle; margin-right: 6px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Toast */
        #toast {
            position: fixed; bottom: 28px; right: 28px;
            background: #1e293b; border: 1px solid rgba(255,255,255,0.12);
            border-radius: 12px; padding: 14px 20px;
            font-size: 0.88rem; max-width: 320px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.4);
            transform: translateY(80px); opacity: 0;
            transition: all 0.3s ease; z-index: 100;
        }
        #toast.show { transform: translateY(0); opacity: 1; }
        #toast.success { border-color: rgba(52,211,153,0.5); color: #34d399; }
        #toast.error   { border-color: rgba(248,113,113,0.5); color: #f87171; }

        /* Empty / loading state */
        .empty-state {
            text-align: center; padding: 80px 24px; opacity: 0.45;
            font-size: 1rem; grid-column: 1/-1;
        }
        .empty-state .icon { font-size: 3rem; margin-bottom: 12px; }

        /* Last triggered info */
        .last-update { font-size: 0.7rem; opacity: 0.4; margin-top: 10px; text-align: right; }
    </style>
</head>
<body>
<div class="container">

    <header>
        <h1>🛡️ Safe & Sound — Backend Dashboard</h1>
        <p>Event-driven health simulation · Firebase-backed · AI-powered via TFLite LSTM</p>
    </header>

    <div class="summary" id="summary">
        <div class="chip"><span class="dot dot-total"></span><span id="s-total">— elders</span></div>
        <div class="chip"><span class="dot dot-normal"></span><span id="s-normal">0 Normal</span></div>
        <div class="chip"><span class="dot dot-warning"></span><span id="s-warning">0 Warning</span></div>
        <div class="chip"><span class="dot dot-danger"></span><span id="s-danger">0 Danger</span></div>
        <div class="chip"><span class="dot dot-notwear"></span><span id="s-notwear">0 Not Wearing</span></div>
    </div>

    <div class="toolbar">
        <span class="refresh-info" id="refresh-info">Auto-refreshes every 10s</span>
        <button class="refresh-btn" onclick="loadElders()">↻ Refresh now</button>
    </div>

    <div class="grid" id="grid">
        <div class="empty-state">
            <div class="icon"><span class="spinner"></span></div>
            <div>Loading elders from Firebase…</div>
        </div>
    </div>

</div>

<!-- Toast notification -->
<div id="toast"></div>

<script>
// ── State ────────────────────────────────────────────────────────────────
let eldersData = [];

// ── Helpers ──────────────────────────────────────────────────────────────
const fmt = v => (v !== null && v !== undefined) ? v : '—';

function statusBadgeClass(status) {
    const map = {
        Normal: 'badge-Normal', Warning: 'badge-Warning',
        Danger: 'badge-Danger', Not_Wearing: 'badge-Not_Wearing',
        // also handle uppercase variants from sensorPayload.health.status
        NORMAL: 'badge-Normal', WARNING: 'badge-Warning',
        DANGER: 'badge-Danger', NOT_WEARING: 'badge-Not_Wearing',
    };
    return map[status] || 'badge-NO_DATA';
}

function statusCardClass(status) {
    const map = {
        Normal: 'status-Normal', Warning: 'status-Warning',
        Danger: 'status-Danger', Not_Wearing: 'status-Not_Wearing',
        NORMAL: 'status-Normal', WARNING: 'status-Warning',
        DANGER: 'status-Danger', NOT_WEARING: 'status-Not_Wearing',
    };
    return map[status] || '';
}

function displayStatus(status) {
    const map = {
        Normal: 'Normal', Warning: 'Warning', Danger: 'Danger', Not_Wearing: 'Not Wearing',
        NORMAL: 'Normal', WARNING: 'Warning', DANGER: 'Danger', NOT_WEARING: 'Not Wearing',
    };
    return map[status] || 'No Data';
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className   = 'show ' + type;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.className = ''; }, 3500);
}

function formatTime(tsObj) {
    if (!tsObj) return null;
    // Firestore Timestamp from API: { _seconds, _nanoseconds } or ISO string
    let d;
    if (tsObj._seconds) d = new Date(tsObj._seconds * 1000);
    else if (typeof tsObj === 'string') d = new Date(tsObj);
    else return null;
    return d.toLocaleTimeString();
}

// ── Build a single elder card ─────────────────────────────────────────────
function buildCard(elder, latestHealthData) {
    const elderId    = elder.id;
    const name       = ((elder.firstName || '') + ' ' + (elder.lastName || '')).trim() || elderId;
    const ai         = latestHealthData?.aiPrediction || null;
    const sensor     = latestHealthData?.sensorPayload || null;
    const aiStatus   = ai?.status || null;
    const cardClass  = aiStatus ? statusCardClass(aiStatus) : '';
    const badgeClass = aiStatus ? statusBadgeClass(aiStatus) : 'badge-NO_DATA';
    const badgeLabel = aiStatus ? displayStatus(aiStatus) : 'No Data';

    const hr   = sensor?.vitals?.heartRate   ?? '—';
    const spo2 = sensor?.vitals?.spo2        ?? '—';
    const temp = sensor?.vitals?.temperature ?? '—';
    const stress = sensor?.activity?.stress  ?? '—';

    const conf    = ai?.confidence ? (ai.confidence * 100).toFixed(1) : null;
    const confFill = aiStatus ? ('conf-fill-' + aiStatus.replace('_', '_')) : '';
    const confW   = conf ? conf + '%' : '0%';
    const lastT   = latestHealthData?.triggeredAt ? formatTime(latestHealthData.triggeredAt) : null;

    return \`
    <div class="card \${cardClass}" id="card-\${elderId}">

        <div class="card-header">
            <div>
                <div class="elder-name">\${name}</div>
                <div class="elder-id">\${elderId}</div>
            </div>
            <div class="badge \${badgeClass}" id="badge-\${elderId}">\${badgeLabel}</div>
        </div>

        <div class="vitals">
            <div class="vital-box">
                <div class="vital-label">❤️ HR</div>
                <div class="vital-value" id="v-hr-\${elderId}">\${fmt(hr)}</div>
            </div>
            <div class="vital-box">
                <div class="vital-label">🫁 SpO2</div>
                <div class="vital-value" id="v-spo2-\${elderId}">\${fmt(spo2)}%</div>
            </div>
            <div class="vital-box">
                <div class="vital-label">🌡️ Temp</div>
                <div class="vital-value" id="v-temp-\${elderId}">\${fmt(temp)}°</div>
            </div>
            <div class="vital-box">
                <div class="vital-label">😰 Stress</div>
                <div class="vital-value" id="v-stress-\${elderId}">\${fmt(stress)}</div>
            </div>
        </div>

        \${conf ? \`
        <div class="confidence-row">
            <span>AI confidence</span>
            <div class="conf-bar-bg">
                <div class="conf-bar-fill \${confFill}" style="width:\${confW}"></div>
            </div>
            <span>\${conf}%</span>
        </div>
        \` : ''}

        <div class="btn-row">
            <button class="btn-trigger btn-normal"  onclick="trigger('\${elderId}', 'NORMAL')">✅ Normal</button>
            <button class="btn-trigger btn-warning" onclick="trigger('\${elderId}', 'WARNING')">⚠️ Warning</button>
            <button class="btn-trigger btn-danger"  onclick="trigger('\${elderId}', 'DANGER')">🚨 Danger</button>
            <button class="btn-trigger btn-notwear" onclick="trigger('\${elderId}', 'NOT_WEARING')">👕 Not<br>Wearing</button>
        </div>

        \${lastT ? \`<div class="last-update">Last triggered: \${lastT}</div>\` : ''}
    </div>\`;
}

// ── Update summary chips ──────────────────────────────────────────────────
function updateSummary(data) {
    const counts = { Normal: 0, Warning: 0, Danger: 0, Not_Wearing: 0 };
    data.forEach(({ latestHealthData }) => {
        const s = latestHealthData?.aiPrediction?.status;
        if (s && counts[s] !== undefined) counts[s]++;
    });
    document.getElementById('s-total').textContent   = data.length + ' elder' + (data.length !== 1 ? 's' : '');
    document.getElementById('s-normal').textContent  = counts.Normal      + ' Normal';
    document.getElementById('s-warning').textContent = counts.Warning     + ' Warning';
    document.getElementById('s-danger').textContent  = counts.Danger      + ' Danger';
    document.getElementById('s-notwear').textContent = counts.Not_Wearing + ' Not Wearing';
}

// ── Load all elders from Firebase (via backend API) ───────────────────────
async function loadElders() {
    try {
        const res    = await fetch('/api/elders');
        const result = await res.json();

        if (!result.success) throw new Error(result.message || 'Failed to load elders');

        eldersData = result.data;

        const grid = document.getElementById('grid');

        if (eldersData.length === 0) {
            grid.innerHTML = \`<div class="empty-state">
                <div class="icon">👤</div>
                <div>No elder users found in Firebase.<br>Register an elder in the mobile app first.</div>
            </div>\`;
            updateSummary([]);
            return;
        }

        grid.innerHTML = eldersData
            .map(({ elder, latestHealthData }) => buildCard(elder, latestHealthData))
            .join('');

        updateSummary(eldersData);

        const now = new Date().toLocaleTimeString();
        document.getElementById('refresh-info').textContent = 'Last refreshed: ' + now + ' · auto every 10s';

    } catch (err) {
        console.error('Load error:', err);
        document.getElementById('grid').innerHTML = \`
            <div class="empty-state">
                <div class="icon">❌</div>
                <div>Failed to load elders: \${err.message}</div>
            </div>\`;
    }
}

// ── Trigger a status for one elder ───────────────────────────────────────
async function trigger(elderId, status) {
    const card    = document.getElementById('card-' + elderId);
    const badge   = document.getElementById('badge-' + elderId);
    const buttons = card.querySelectorAll('.btn-trigger');

    // Loading state
    card.classList.add('loading');
    buttons.forEach(b => b.disabled = true);
    badge.innerHTML = '<span class="spinner"></span> Processing…';
    badge.className = 'badge badge-NO_DATA';

    try {
        const res    = await fetch('/api/trigger/' + elderId, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ status }),
        });
        const result = await res.json();

        if (!result.success) throw new Error(result.message || 'Trigger failed');

        const ai     = result.aiPrediction;
        const sensor = result.sensorPayload;

        // Update badge
        const newBadgeClass = statusBadgeClass(ai.status);
        badge.textContent = displayStatus(ai.status);
        badge.className   = 'badge ' + newBadgeClass;

        // Update card border
        card.className = 'card ' + statusCardClass(ai.status);

        // Update vitals
        const v = sensor?.vitals || {};
        const a = sensor?.activity || {};
        document.getElementById('v-hr-'    + elderId).textContent = fmt(v.heartRate)   || '—';
        document.getElementById('v-spo2-'  + elderId).textContent = (fmt(v.spo2) !== '—' ? fmt(v.spo2) + '%' : '—');
        document.getElementById('v-temp-'  + elderId).textContent = (fmt(v.temperature) !== '—' ? fmt(v.temperature) + '°' : '—');
        document.getElementById('v-stress-'+ elderId).textContent = fmt(a.stress) || '—';

        const conf = ai.confidence ? (ai.confidence * 100).toFixed(1) : '—';
        showToast(\`\${result.aiPrediction.status} · \${conf}% confidence\`, 'success');

        // Refresh this card's confidence bar by doing a quick partial re-render
        // We update the latestHealthData in eldersData and re-render just that card
        const idx = eldersData.findIndex(d => d.elder.id === elderId);
        if (idx !== -1) {
            eldersData[idx].latestHealthData = {
                aiPrediction:  result.aiPrediction,
                sensorPayload: result.sensorPayload,
                triggeredAt:   { _seconds: Math.floor(Date.now() / 1000) },
            };
        }
        updateSummary(eldersData);

    } catch (err) {
        console.error('Trigger error:', err);
        badge.textContent = 'Error';
        badge.className   = 'badge badge-NO_DATA';
        showToast('Error: ' + err.message, 'error');
    } finally {
        card.classList.remove('loading');
        buttons.forEach(b => b.disabled = false);
    }
}

// ── Init ──────────────────────────────────────────────────────────────────
loadElders();
setInterval(loadElders, 10000);
</script>
</body>
</html>`;
    res.send(html);
});

module.exports = router;
