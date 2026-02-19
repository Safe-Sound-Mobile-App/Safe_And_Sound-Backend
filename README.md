# Safe & Sound Backend v2.0

**Self-Data Oriented Health Monitoring System**

A clean, professional backend API for generating and managing health monitoring data with real-time status calculations.

## 🎯 Features

- **Self-Data Generation**: No external watch dependency - generates realistic health data internally
- **4 Status Levels**: NORMAL, WARNING, DANGER, NOT_WEARING
- **Comprehensive Vitals**: Heart rate, blood oxygen (SpO2), temperature, blood pressure, gyroscope, accelerometer, and more
- **Real-time Monitoring**: Auto-calculating health status with alert system
- **Beautiful Dashboard**: Modern, responsive web interface for data visualization
- **RESTful API**: Clean, well-documented endpoints

## 📊 Health Status Levels

| Status | Description | Triggers |
|--------|-------------|----------|
| **NORMAL** | All vitals within healthy range | HR: 60-100 BPM, SpO2: >95%, Stress: <60 |
| **WARNING** | Some vitals slightly elevated | HR: 50-120 BPM, SpO2: 90-95%, Stress: 60-79 |
| **DANGER** | Critical vitals detected | HR: <40 or >150 BPM, SpO2: <85%, Stress: >80 |
| **NOT_WEARING** | Device not on user | wearState = 0 |

## 🚀 Getting Started

### Installation

```bash
cd Backend
npm install
```

### Running the Server

```bash
npm start
```

Server runs on `http://localhost:3000`

## 📡 API Endpoints

### Health Data Management

#### Generate Health Data
```http
POST /api/health/generate
Content-Type: application/json

{
  "status": "NORMAL",  // Optional: NORMAL, WARNING, DANGER, NOT_WEARING
  "userId": "user123"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Health data generated successfully",
  "data": {
    "userId": "user123",
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
      "gyro": { "x": 2.5, "y": -1.3, "z": 0.8 },
      "accelerometer": { "x": 1.2, "y": 0.5, "z": -0.3 }
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
}
```

#### Get Latest Health Data
```http
GET /api/health/latest
```

#### Get Health History
```http
GET /api/health/history?limit=10&status=NORMAL&userId=user123
```

#### Get Health Statistics
```http
GET /api/health/stats
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

#### Sync External Data
```http
POST /api/health/sync
Content-Type: application/json

{
  "heartRate": 80,
  "spo2": 97,
  "temperature": 36.5,
  "gyro": { "x": 0, "y": 0, "z": 0 },
  "steps": 1000,
  "wearState": 1
}
```

#### Clear All Data
```http
DELETE /api/health/clear
```

#### Check API Status
```http
GET /api/health/status
```

## 🖥️ Dashboard Views

### Main Dashboard
`GET /display/dashboard`

Beautiful, real-time health monitoring dashboard with:
- Live status indicator
- All vital signs display
- Auto-refresh every 3 seconds
- Quick data generation buttons

### Statistics View
`GET /display/stats`

Comprehensive statistics including:
- Total records count
- Status distribution
- Average vitals
- Real-time updates

### Quick Access
- Root URL (`/`) redirects to dashboard
- Legacy routes (`/api/vitals/*`) still supported

## 📁 Project Structure

```
Backend/
├── src/
│   ├── models/
│   │   └── HealthData.js          # Health data model & validation
│   ├── services/
│   │   ├── dataGenerator.js       # Generates realistic health data
│   │   └── statusCalculator.js    # Calculates health status from vitals
│   ├── controllers/
│   │   └── healthController.js    # Business logic for API endpoints
│   ├── routes/
│   │   ├── healthRoutes.js        # API route definitions
│   │   └── displayRoutes.js       # Dashboard route definitions
│   ├── app.js                     # Express app configuration
│   └── server.js                  # Server entry point
├── package.json
└── README.md
```

## 🔧 Data Model

### HealthData
```javascript
{
  userId: String,
  timestamp: Number,
  
  // Vitals
  heartRate: Number,           // BPM
  bloodOxygen: Number,         // % (alias: spo2)
  spo2: Number,               // % (alias: bloodOxygen)
  temperature: Number,         // Celsius
  bloodPressure: {
    systolic: Number,          // mmHg
    diastolic: Number          // mmHg
  },
  
  // Motion
  gyro: { x, y, z },          // Degrees/second
  accelerometer: { x, y, z },  // G-force
  
  // Activity
  steps: Number,
  calories: Number,
  stress: Number,              // 0-100
  
  // Device
  wearState: Number,           // 0 or 1
  batteryLevel: Number,        // 0-100
  
  // Health Status
  status: String,              // NORMAL, WARNING, DANGER, NOT_WEARING
  alerts: [String],            // Alert messages
  
  receivedAt: String           // ISO timestamp
}
```

## 🎨 Status Thresholds

### Heart Rate
- **Normal**: 60-100 BPM
- **Warning**: 50-120 BPM
- **Danger**: <40 or >150 BPM

### Blood Oxygen (SpO2)
- **Normal**: ≥95%
- **Warning**: 90-94%
- **Danger**: <85%

### Temperature
- **Normal**: 36.1-37.2°C
- **Warning**: 35.5-38.0°C
- **Danger**: <35.0 or >39.0°C

### Blood Pressure (Systolic/Diastolic)
- **Normal**: <120/80 mmHg
- **Warning**: 120-140/80-90 mmHg
- **Danger**: >140/90 mmHg

### Stress Level
- **Normal**: <60
- **Warning**: 60-79
- **Danger**: ≥80

## 🧪 Testing Examples

### Generate Normal Data
```bash
curl -X POST http://localhost:3000/api/health/generate \
  -H "Content-Type: application/json" \
  -d '{"status": "NORMAL"}'
```

### Generate Danger Alert
```bash
curl -X POST http://localhost:3000/api/health/generate \
  -H "Content-Type: application/json" \
  -d '{"status": "DANGER"}'
```

### Get Latest Data
```bash
curl http://localhost:3000/api/health/latest
```

### View Dashboard
```bash
open http://localhost:3000/display/dashboard
```

## 🔄 Migration from v1.0

The new backend maintains backward compatibility:
- Old route `/api/vitals/latest` still works
- Old route `/api/vitals/sync` still works
- Data structure extended but compatible

## 🛠️ Development

### Environment Variables
Create a `.env` file:
```env
PORT=3000
NODE_ENV=development
```

### Running in Development
```bash
npm run dev  # With nodemon (if installed)
npm start    # Standard mode
```

## 📝 Notes

- Data is stored in-memory (max 100 records)
- For production, integrate with a database (MongoDB, PostgreSQL, etc.)
- Status calculation is automatic based on vitals
- Alerts are generated when thresholds are exceeded

## 🔐 Security

- CORS enabled for all origins (configure for production)
- Input validation through HealthData model
- Error handling middleware included
- Request logging for debugging

## 📈 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] User authentication & authorization
- [ ] WebSocket for real-time updates
- [ ] Historical data charts
- [ ] Email/SMS alerts for critical status
- [ ] ML-based anomaly detection
- [ ] Export data (CSV, JSON)

## 📄 License

ISC

## 👥 Support

For issues or questions, please contact the development team.

---

**Safe & Sound Backend v2.0** - Professional Health Monitoring System
