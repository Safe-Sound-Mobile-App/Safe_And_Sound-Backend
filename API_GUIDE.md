# Safe & Sound API Guide

## Quick Start

### 1. Start the Server
```bash
npm start
```

### 2. Open Dashboard
Navigate to: `http://localhost:3000`

### 3. Generate Data
Click any button on the dashboard or use the API:
```bash
curl -X POST http://localhost:3000/api/health/generate \
  -H "Content-Type: application/json" \
  -d '{"status": "NORMAL"}'
```

## API Endpoints Overview

### 📊 Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/health/generate` | Generate new health data |
| GET | `/api/health/latest` | Get most recent data |
| GET | `/api/health/history` | Get historical data |
| GET | `/api/health/stats` | Get statistics |
| POST | `/api/health/sync` | Sync external data |
| DELETE | `/api/health/clear` | Clear all data |
| GET | `/api/health/status` | Check API status |

### 🖥️ Dashboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/display/dashboard` | Main dashboard |
| GET | `/display/stats` | Statistics view |
| GET | `/` | Redirects to dashboard |

## Status Levels

### NORMAL ✅
All vitals within healthy ranges. No alerts.

**Example:**
```json
{
  "status": "NORMAL",
  "vitals": {
    "heartRate": 75,
    "spo2": 98,
    "temperature": 36.8,
    "bloodPressure": { "systolic": 115, "diastolic": 75 }
  },
  "alerts": []
}
```

### WARNING ⚠️
Some vitals slightly elevated. Monitor closely.

**Example:**
```json
{
  "status": "WARNING",
  "vitals": {
    "heartRate": 115,
    "spo2": 92,
    "temperature": 37.8
  },
  "alerts": [
    "Elevated heart rate",
    "Monitor vitals closely"
  ]
}
```

### DANGER 🚨
Critical vitals detected. Immediate attention required.

**Example:**
```json
{
  "status": "DANGER",
  "vitals": {
    "heartRate": 155,
    "spo2": 82,
    "temperature": 39.2
  },
  "alerts": [
    "Critical heart rate detected",
    "Low blood oxygen levels",
    "High stress detected"
  ]
}
```

### NOT_WEARING 👕
Device not being worn.

**Example:**
```json
{
  "status": "NOT_WEARING",
  "device": {
    "wearState": 0
  },
  "alerts": [
    "Device not being worn"
  ]
}
```

## Usage Examples

### Generate Specific Status

#### Normal Health Data
```bash
curl -X POST http://localhost:3000/api/health/generate \
  -H "Content-Type: application/json" \
  -d '{"status": "NORMAL", "userId": "user123"}'
```

#### Warning Status
```bash
curl -X POST http://localhost:3000/api/health/generate \
  -H "Content-Type: application/json" \
  -d '{"status": "WARNING"}'
```

#### Danger Alert
```bash
curl -X POST http://localhost:3000/api/health/generate \
  -H "Content-Type: application/json" \
  -d '{"status": "DANGER"}'
```

#### Not Wearing
```bash
curl -X POST http://localhost:3000/api/health/generate \
  -H "Content-Type: application/json" \
  -d '{"status": "NOT_WEARING"}'
```

#### Random Status (Weighted)
```bash
curl -X POST http://localhost:3000/api/health/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Get Latest Data
```bash
curl http://localhost:3000/api/health/latest
```

### Get History with Filters

#### Last 20 records
```bash
curl "http://localhost:3000/api/health/history?limit=20"
```

#### Only WARNING status
```bash
curl "http://localhost:3000/api/health/history?status=WARNING"
```

#### Specific user
```bash
curl "http://localhost:3000/api/health/history?userId=user123"
```

#### Combined filters
```bash
curl "http://localhost:3000/api/health/history?limit=50&status=DANGER&userId=user123"
```

### Get Statistics
```bash
curl http://localhost:3000/api/health/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": {
      "NORMAL": 105,
      "WARNING": 30,
      "DANGER": 12,
      "NOT_WEARING": 3
    },
    "averages": {
      "heartRate": "76.50",
      "spo2": "96.80",
      "temperature": "36.90",
      "stress": "42.30"
    },
    "latest": { ... }
  }
}
```

### Sync External Data
```bash
curl -X POST http://localhost:3000/api/health/sync \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "heartRate": 80,
    "spo2": 97,
    "temperature": 36.5,
    "gyro": {"x": 0, "y": 0, "z": 0},
    "steps": 5000,
    "wearState": 1
  }'
```

### Clear All Data
```bash
curl -X DELETE http://localhost:3000/api/health/clear
```

### Check API Status
```bash
curl http://localhost:3000/api/health/status
```

## Data Structure

### Complete Health Data Object
```json
{
  "userId": "user_test",
  "timestamp": 1707926400000,
  "vitals": {
    "heartRate": 75,
    "bloodOxygen": 98,
    "spo2": 98,
    "temperature": 36.8,
    "bloodPressure": {
      "systolic": 115,
      "diastolic": 75
    }
  },
  "motion": {
    "gyro": {
      "x": 2.5,
      "y": -1.3,
      "z": 0.8
    },
    "accelerometer": {
      "x": 1.2,
      "y": 0.5,
      "z": -0.3
    }
  },
  "activity": {
    "steps": 5234,
    "calories": 209,
    "stress": 35
  },
  "device": {
    "wearState": 1,
    "batteryLevel": 85
  },
  "health": {
    "status": "NORMAL",
    "alerts": []
  },
  "receivedAt": "2024-02-14T12:00:00.000Z"
}
```

## Integration Examples

### JavaScript/Fetch
```javascript
// Generate data
async function generateHealthData(status = 'NORMAL') {
  const response = await fetch('http://localhost:3000/api/health/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return await response.json();
}

// Get latest
async function getLatestData() {
  const response = await fetch('http://localhost:3000/api/health/latest');
  return await response.json();
}

// Usage
const data = await generateHealthData('WARNING');
console.log(data);
```

### Python
```python
import requests

# Generate data
def generate_health_data(status='NORMAL'):
    response = requests.post(
        'http://localhost:3000/api/health/generate',
        json={'status': status}
    )
    return response.json()

# Get latest
def get_latest_data():
    response = requests.get('http://localhost:3000/api/health/latest')
    return response.json()

# Usage
data = generate_health_data('DANGER')
print(data)
```

### React Example
```javascript
import { useState, useEffect } from 'react';

function HealthMonitor() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('http://localhost:3000/api/health/latest');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const generateData = async (status) => {
    await fetch('http://localhost:3000/api/health/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  };

  return (
    <div>
      <h1>Status: {data?.health?.status}</h1>
      <p>Heart Rate: {data?.vitals?.heartRate} BPM</p>
      <p>SpO2: {data?.vitals?.spo2}%</p>
      <button onClick={() => generateData('NORMAL')}>Generate Normal</button>
      <button onClick={() => generateData('WARNING')}>Generate Warning</button>
      <button onClick={() => generateData('DANGER')}>Generate Danger</button>
    </div>
  );
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request",
  "message": "Status must be one of: NORMAL, WARNING, DANGER, NOT_WEARING"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Endpoint not found",
  "path": "/api/invalid",
  "availableEndpoints": { ... }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Error details here"
}
```

## Rate Limiting

Currently no rate limiting implemented. For production:
- Consider implementing rate limiting (e.g., express-rate-limit)
- Recommended: 100 requests per minute per IP

## CORS

Currently configured to allow all origins:
```javascript
origin: '*'
```

For production, configure specific origins:
```javascript
origin: ['https://yourdomain.com', 'https://app.yourdomain.com']
```

## Testing Workflow

### 1. Start Fresh
```bash
curl -X DELETE http://localhost:3000/api/health/clear
```

### 2. Generate Test Data
```bash
# Generate 10 normal readings
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/health/generate \
    -H "Content-Type: application/json" \
    -d '{"status": "NORMAL"}'
done

# Generate 5 warnings
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/health/generate \
    -H "Content-Type: application/json" \
    -d '{"status": "WARNING"}'
done

# Generate 2 dangers
for i in {1..2}; do
  curl -X POST http://localhost:3000/api/health/generate \
    -H "Content-Type: application/json" \
    -d '{"status": "DANGER"}'
done
```

### 3. View Statistics
```bash
curl http://localhost:3000/api/health/stats
```

### 4. View Dashboard
Open: `http://localhost:3000/display/dashboard`

## Need Help?

- Check server console for detailed logs
- Verify API status: `curl http://localhost:3000/api/health/status`
- View available endpoints: `curl http://localhost:3000/api/invalid` (returns 404 with endpoint list)

---

**Safe & Sound Backend v2.0** - Complete API Guide
