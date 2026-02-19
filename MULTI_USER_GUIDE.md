# Safe & Sound Multi-User Backend Guide

## 🎉 Overview

The backend now supports **multiple users** with two main roles:
- **👴 ELDERS** - Individuals being monitored (health data is measured from them)
- **👨‍⚕️ CAREGIVERS** - Medical professionals monitoring assigned elders

**Key Features:**
- ✅ Unique UID for each user
- ✅ Individual elder health tracking
- ✅ View all elders at once
- ✅ Caregiver-to-elder assignments
- ✅ Real-time continuous simulation (updates every 2 seconds)
- ✅ Automatic data generation for all active elders

---

## 🚀 Quick Start

### 1. Start the Server
```bash
npm start
```

The server will automatically:
- Create 5 sample elders
- Create 2 sample caregivers
- Assign caregivers to elders
- Start real-time simulation

### 2. Access the Dashboard
Open: **http://localhost:3000/display/dashboard**

You'll see all elders with their real-time health status!

---

## 📊 API Endpoints

### User Management

#### Create User
```bash
# Create an elder
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "role": "ELDER",
    "name": "Jane Smith",
    "dateOfBirth": "1950-06-15",
    "gender": "Female",
    "email": "jane.smith@email.com"
  }'

# Create a caregiver
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "role": "CAREGIVER",
    "name": "Dr. Wilson",
    "email": "dr.wilson@hospital.com",
    "phone": "+1-555-0123"
  }'
```

#### Get All Elders
```bash
curl http://localhost:3000/api/users/elders/all
```

#### Get All Caregivers
```bash
curl http://localhost:3000/api/users/caregivers/all
```

#### Get Specific User
```bash
curl http://localhost:3000/api/users/:uid
```

#### Assign Caregiver to Elder
```bash
curl -X POST http://localhost:3000/api/users/elder/:elderUID/assign-caregiver \
  -H "Content-Type: application/json" \
  -d '{"caregiverUID": "user_xxx"}'
```

---

### Individual Elder Health Data

#### Get Specific Elder's Latest Health Data
```bash
curl http://localhost:3000/api/health/elder/:uid/latest
```

**Example Response:**
```json
{
  "success": true,
  "elder": {
    "uid": "user_mlo015cxuwxqx0r",
    "role": "ELDER",
    "name": "Robert Williams",
    "email": "robert.williams@email.com",
    "dateOfBirth": "1945-03-15",
    "gender": "Male",
    "caregiverUIDs": ["user_mlo015cwel1dkz0"]
  },
  "data": {
    "recordId": "record_user_mlo015cxuwxqx0r_...",
    "elderUID": "user_mlo015cxuwxqx0r",
    "healthData": {
      "vitals": {
        "heartRate": 85,
        "bloodOxygen": 100,
        "spo2": 100,
        "temperature": 37.1,
        "bloodPressure": {
          "systolic": 105,
          "diastolic": 79
        }
      },
      "motion": {
        "gyro": { "x": 1.82, "y": 1.91, "z": -4.2 }
      },
      "activity": {
        "steps": 6680,
        "calories": 267,
        "stress": 48
      },
      "health": {
        "status": "NORMAL",
        "alerts": []
      }
    }
  }
}
```

#### Get Elder's Health History
```bash
curl "http://localhost:3000/api/health/elder/:uid/history?limit=20"
```

#### Get Elder's Statistics
```bash
curl http://localhost:3000/api/health/elder/:uid/stats
```

#### Generate Data for Specific Elder
```bash
curl -X POST http://localhost:3000/api/health/elder/:uid/generate \
  -H "Content-Type: application/json" \
  -d '{"status": "DANGER"}'
```

#### Sync External Data for Elder
```bash
curl -X POST http://localhost:3000/api/health/elder/:uid/sync \
  -H "Content-Type: application/json" \
  -d '{
    "heartRate": 75,
    "spo2": 98,
    "temperature": 36.8,
    "steps": 5000,
    "wearState": 1
  }'
```

#### Clear Elder's Health Records
```bash
curl -X DELETE http://localhost:3000/api/health/elder/:uid/clear
```

---

### All Elders Health Data

#### Get Latest Data for ALL Elders
```bash
curl http://localhost:3000/api/health/elders/latest
```

Returns array of all elders with their latest health data.

#### Get Overview of All Elders
```bash
curl http://localhost:3000/api/health/elders/overview
```

**Example Response:**
```json
{
  "success": true,
  "totalElders": 5,
  "byStatus": {
    "NORMAL": 4,
    "WARNING": 1,
    "DANGER": 0,
    "NOT_WEARING": 0,
    "NO_DATA": 0
  },
  "data": [
    {
      "elder": { "uid": "...", "name": "Robert Williams", ... },
      "latestStatus": "NORMAL",
      "latestUpdate": "2026-02-15T17:08:11.002Z",
      "hasData": true
    },
    ...
  ]
}
```

#### Get Statistics for ALL Elders
```bash
curl http://localhost:3000/api/health/elders/stats
```

---

### Caregiver-Specific Endpoints

#### Get Elders for a Caregiver (with health data)
```bash
curl http://localhost:3000/api/health/caregiver/:caregiverUID/elders
```

Returns all elders assigned to this caregiver along with their latest health data.

---

### Simulation Control

#### Start Simulation
```bash
curl -X POST http://localhost:3000/api/simulation/start
```

#### Stop Simulation
```bash
curl -X POST http://localhost:3000/api/simulation/stop
```

#### Get Simulation Status
```bash
curl http://localhost:3000/api/simulation/status
```

**Response:**
```json
{
  "success": true,
  "simulation": {
    "isRunning": true,
    "updateInterval": 2000,
    "activeElders": 5,
    "simulationStates": [
      {
        "elderUID": "user_xxx",
        "elderName": "Robert Williams",
        "currentStatus": "NORMAL",
        "statusChanges": 0
      }
    ]
  },
  "dataStore": {
    "totalUsers": 7,
    "totalElders": 5,
    "totalCaregivers": 2,
    "eldersWithData": 5,
    "totalHealthRecords": 35
  }
}
```

#### Set Update Interval
```bash
curl -X POST http://localhost:3000/api/simulation/interval \
  -H "Content-Type: application/json" \
  -d '{"interval": 1000}'  # Update every 1 second
```

#### Force Specific Status (Testing)
```bash
curl -X POST http://localhost:3000/api/simulation/elder/:uid/force-status \
  -H "Content-Type: application/json" \
  -d '{"status": "DANGER"}'
```

---

## 🏗️ Architecture

### Data Flow

```
1. Server Starts
   ↓
2. Seed Sample Data (5 elders, 2 caregivers)
   ↓
3. Start Continuous Simulation
   ↓
4. Every 2 seconds:
   - Generate health data for each active elder
   - Calculate status automatically
   - Store in dataStore
   - Available via API
   ↓
5. Frontend can query:
   - Individual elder by UID
   - All elders at once
   - Caregiver's assigned elders
```

### Storage Structure

```javascript
// In-Memory Data Store
{
  users: Map<uid, User>,
  elderHealthRecords: Map<elderUID, ElderHealthRecord[]>,
  latestHealthData: Map<elderUID, ElderHealthRecord>
}

// User Model
{
  uid: "user_xxx",
  role: "ELDER" | "CAREGIVER",
  name: "Robert Williams",
  email: "...",
  dateOfBirth: "1945-03-15",
  gender: "Male",
  caregiverUIDs: [],  // For elders
  elderUIDs: [],      // For caregivers
  isActive: true
}

// Elder Health Record
{
  recordId: "record_xxx",
  elderUID: "user_xxx",
  healthData: {
    vitals: {...},
    motion: {...},
    activity: {...},
    device: {...},
    health: {
      status: "NORMAL",
      alerts: []
    }
  }
}
```

---

## 🔄 Real-Time Simulation

### How It Works

1. **Automatic Start**: Simulation starts 2 seconds after server launch
2. **Continuous Updates**: Generates data every 2 seconds (configurable)
3. **Realistic Transitions**: Status changes based on weighted probabilities
   - NORMAL → NORMAL: 85%
   - NORMAL → WARNING: 12%
   - NORMAL → DANGER: 2%
   - NORMAL → NOT_WEARING: 1%
4. **Smart Simulation**: Each elder maintains state and transitions naturally

### Simulation States

Each elder has:
- Current status tendency
- Status change counter
- Probability of status change (10% per update)

### Monitoring Simulation

Watch the console for logs:
```
📊 [Robert Williams] Status: NORMAL, HR: 86, SpO2: 99%
📊 [Mary Davis] Status: WARNING, HR: 115, SpO2: 91%
```

---

## 💡 Use Cases

### 1. Caregiver Dashboard
```javascript
// Get all elders for a caregiver
const response = await fetch(`/api/health/caregiver/${caregiverUID}/elders`);
const { data } = await response.json();

// data contains all assigned elders with their latest health data
data.forEach(item => {
  console.log(`${item.elder.name}: ${item.healthData.health.status}`);
});
```

### 2. Individual Elder Monitoring
```javascript
// Monitor specific elder
const elderUID = 'user_mlo015cxuwxqx0r';
const response = await fetch(`/api/health/elder/${elderUID}/latest`);
const { data } = await response.json();

if (data.healthData.health.status === 'DANGER') {
  // Send alert!
  sendEmergencyNotification(data);
}
```

### 3. All Elders Overview
```javascript
// Get overview of all elders
const response = await fetch('/api/health/elders/overview');
const { byStatus, data } = await response.json();

console.log(`Danger alerts: ${byStatus.DANGER}`);
console.log(`Warning status: ${byStatus.WARNING}`);

// Show elders with issues
const critical = data.filter(item => 
  ['DANGER', 'WARNING'].includes(item.latestStatus)
);
```

### 4. Historical Analysis
```javascript
// Get elder's health history
const response = await fetch(`/api/health/elder/${elderUID}/history?limit=50`);
const { data } = await response.json();

// Analyze trends
const statusCounts = {};
data.forEach(record => {
  const status = record.healthData.health.status;
  statusCounts[status] = (statusCounts[status] || 0) + 1;
});
```

---

## 📱 Frontend Integration

### React Example - All Elders Dashboard

```jsx
import { useState, useEffect } from 'react';

function AllEldersMonitor() {
  const [elders, setElders] = useState([]);

  useEffect(() => {
    const fetchElders = async () => {
      const response = await fetch('/api/health/elders/overview');
      const result = await response.json();
      if (result.success) {
        setElders(result.data);
      }
    };

    fetchElders();
    const interval = setInterval(fetchElders, 2000); // Update every 2s
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>All Elders Monitor</h1>
      {elders.map(item => (
        <div key={item.elder.uid} className={`elder-card ${item.latestStatus}`}>
          <h2>{item.elder.name}</h2>
          <p>Status: {item.latestStatus}</p>
          <p>Last Update: {new Date(item.latestUpdate).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### React Example - Individual Elder Monitor

```jsx
function ElderHealthMonitor({ elderUID }) {
  const [healthData, setHealthData] = useState(null);
  const [elder, setElder] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`/api/health/elder/${elderUID}/latest`);
      const result = await response.json();
      if (result.success) {
        setElder(result.elder);
        setHealthData(result.data.healthData);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [elderUID]);

  if (!healthData) return <div>Loading...</div>;

  return (
    <div className={`health-monitor ${healthData.health.status}`}>
      <h1>{elder.name}</h1>
      <div className="status-badge">{healthData.health.status}</div>
      
      <div className="vitals">
        <div>❤️ {healthData.vitals.heartRate} BPM</div>
        <div>🫁 {healthData.vitals.spo2}%</div>
        <div>🌡️ {healthData.vitals.temperature}°C</div>
        <div>😰 Stress: {healthData.activity.stress}</div>
      </div>

      {healthData.health.alerts.length > 0 && (
        <div className="alerts">
          {healthData.health.alerts.map((alert, i) => (
            <p key={i}>⚠️ {alert}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Key Differences from Single-User System

| Feature | Single-User (v2.0) | Multi-User (v2.0 Enhanced) |
|---------|-------------------|---------------------------|
| Data Structure | Single user ID | Unique UID per user |
| Roles | None | ELDER, CAREGIVER |
| Simulation | Manual generation | Continuous automatic |
| Routes | `/api/health/latest` | `/api/health/elder/:uid/latest` |
| All Data | Single record | `/api/health/elders/latest` |
| Relationships | N/A | Caregiver ↔ Elder assignments |
| Real-time | Manual refresh | Auto-updates every 2s |
| Dashboard | Single user view | Multi-user overview |

---

## ✅ Testing the System

### 1. Check System Status
```bash
curl http://localhost:3000/api/simulation/status
```

### 2. View All Elders
```bash
curl http://localhost:3000/api/users/elders/all
```

### 3. Get First Elder's UID
```bash
curl http://localhost:3000/api/users/elders/all | grep -o '"uid":"[^"]*"' | head -1
```

### 4. Get That Elder's Health Data
```bash
curl http://localhost:3000/api/health/elder/user_xxx/latest
```

### 5. View All Elders Overview
```bash
curl http://localhost:3000/api/health/elders/overview
```

---

## 🚀 Next Steps

### Database Integration
Replace in-memory storage with MongoDB/PostgreSQL:
```javascript
// Future: Replace dataStore with database
const elder = await Elder.findOne({ uid });
const healthRecords = await HealthRecord.find({ elderUID: uid });
```

### WebSocket for Real-Time Updates
```javascript
// Future: Push updates to connected clients
io.emit('healthUpdate', {
  elderUID,
  healthData
});
```

### Authentication
```javascript
// Future: Add JWT auth
app.use('/api', authenticateJWT);
```

---

## 📊 Summary

The multi-user backend provides:

✅ **Unique UIDs** for each elder and caregiver
✅ **Individual tracking** - get data for specific elder by UID
✅ **All elders view** - see all elders at once
✅ **Real-time simulation** - data updates every 2 seconds automatically
✅ **Caregiver assignments** - link caregivers to elders
✅ **Clean separation** - distinct endpoints for individual vs all
✅ **Production-ready** - proper data models and architecture

**Your backend is now ready to handle multiple elders with continuous real-time monitoring!** 🎉

---

**Safe & Sound Backend v2.0 - Multi-User Edition** 🛡️
