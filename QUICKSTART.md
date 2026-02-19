# 🚀 Quick Start Guide

## Installation & Setup

```bash
cd Backend
npm install
npm start
```

Server will start on: **http://localhost:3000**

## Access Dashboard

Open your browser: **http://localhost:3000**

You'll see the beautiful dashboard with buttons to generate data!

## Test the API

### 1. Check API Status
```bash
curl http://localhost:3000/api/health/status
```

### 2. Generate Test Data

**Normal Status:**
```bash
curl -X POST http://localhost:3000/api/health/generate \
  -H "Content-Type: application/json" \
  -d '{"status": "NORMAL"}'
```

**Warning Status:**
```bash
curl -X POST http://localhost:3000/api/health/generate \
  -H "Content-Type: application/json" \
  -d '{"status": "WARNING"}'
```

**Danger Alert:**
```bash
curl -X POST http://localhost:3000/api/health/generate \
  -H "Content-Type: application/json" \
  -d '{"status": "DANGER"}'
```

**Not Wearing:**
```bash
curl -X POST http://localhost:3000/api/health/generate \
  -H "Content-Type: application/json" \
  -d '{"status": "NOT_WEARING"}'
```

### 3. Get Latest Data
```bash
curl http://localhost:3000/api/health/latest
```

### 4. View Statistics
```bash
curl http://localhost:3000/api/health/stats
```

## Dashboard Features

- **Real-time Updates**: Auto-refreshes every 3 seconds
- **Status Indicator**: Visual alerts for health status
- **Quick Generate**: Buttons to generate different status levels
- **All Vitals**: Heart rate, SpO2, temperature, BP, motion, and more

## Available Dashboards

- **Main Dashboard**: http://localhost:3000/display/dashboard
- **Statistics View**: http://localhost:3000/display/stats

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/generate` | POST | Generate new data |
| `/api/health/latest` | GET | Get latest data |
| `/api/health/history` | GET | Get history |
| `/api/health/stats` | GET | Get statistics |
| `/api/health/sync` | POST | Sync external data |
| `/api/health/clear` | DELETE | Clear all data |
| `/api/health/status` | GET | Check API status |

## Health Status Levels

| Status | Icon | Description |
|--------|------|-------------|
| **NORMAL** | ✅ | All vitals healthy |
| **WARNING** | ⚠️ | Elevated vitals |
| **DANGER** | 🚨 | Critical alerts |
| **NOT_WEARING** | 👕 | Device not worn |

## Next Steps

1. Read the full [README.md](README.md) for detailed documentation
2. Check [API_GUIDE.md](API_GUIDE.md) for integration examples
3. Start generating data and monitor the dashboard!

## Need Help?

Check the server console for detailed logs showing:
- Incoming requests
- Generated data
- Status calculations
- Any errors

---

**Safe & Sound Backend v2.0** - Ready to Monitor! 🛡️
