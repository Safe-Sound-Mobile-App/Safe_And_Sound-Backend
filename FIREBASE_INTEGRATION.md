# 🔥 Firebase Integration Guide

## Overview

Your backend is designed as a **data generation and storage template** that works with Firebase authentication. Your friend's OAuth/authentication system will provide user UIDs from Firebase, and this backend will generate continuous cycling health data for those elder users.

---

## 🎯 Integration Strategy

### Current Setup
- ✅ Your Backend: Health data generation & storage
- ✅ Friend's System: OAuth authentication with Firebase

### Integration Flow
```
Firebase (Authentication)
    ↓
    Provides Elder UIDs
    ↓
Your Backend (Health Data Template)
    ↓
    Generates continuous health data for those UIDs
    ↓
Frontend queries both systems
```

---

## 🔄 How It Works

### 1. Firebase Provides User UIDs

When a user logs in via Firebase:
```javascript
// Friend's authentication system (Firebase)
const user = await firebase.auth().signInWithEmailAndPassword(email, password);
const firebaseUID = user.uid; // e.g., "firebase_abc123xyz"
```

### 2. Your Backend Accepts Firebase UIDs

Your backend is **UID-agnostic** - it accepts any UID string:

```javascript
// Create elder with Firebase UID
POST /api/users
{
  "uid": "firebase_abc123xyz",  // ← Use Firebase UID directly
  "role": "ELDER",
  "name": "John Doe",
  "email": "john@example.com",
  "dateOfBirth": "1950-05-15"
}
```

### 3. Backend Generates Cycling Data

Once the elder exists with Firebase UID, the simulation automatically generates continuous health data:

```javascript
// Your backend automatically generates data every 2 seconds
// for all active elders, including those with Firebase UIDs
```

### 4. Frontend Fetches Data by Firebase UID

```javascript
// Frontend uses Firebase UID to get health data
const firebaseUID = firebase.auth().currentUser.uid;
const response = await fetch(`/api/health/elder/${firebaseUID}/latest`);
const healthData = await response.json();
```

---

## 🔌 Integration Steps

### Step 1: Modify User Creation

Update the `User` model to accept Firebase UIDs without generating new ones:

**Current Code** (in `src/models/User.js`):
```javascript
this.uid = data.uid || this.generateUID();
```

**For Firebase Integration** (keep as is - it already works!):
```javascript
// If Firebase UID is provided, use it
// If not, generate a new one
this.uid = data.uid || this.generateUID();
```

✅ **No change needed!** The current code already supports external UIDs.

### Step 2: Sync Firebase Users to Your Backend

When a user registers or logs in via Firebase, create them in your backend:

```javascript
// After successful Firebase authentication
async function syncUserToHealthBackend(firebaseUser) {
  const response = await fetch('http://your-backend:3000/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: firebaseUser.uid,           // ← Firebase UID
      role: 'ELDER',                    // or 'CAREGIVER'
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      // ... other fields
    })
  });
  
  if (response.ok) {
    console.log('User synced to health backend');
  }
}
```

### Step 3: Start Simulation for New Users

The simulation automatically includes all active elders, but you can ensure a user is included:

```javascript
// Check if simulation is running
const statusResponse = await fetch('http://your-backend:3000/api/simulation/status');
const status = await statusResponse.json();

if (!status.simulation.isRunning) {
  // Start simulation if not running
  await fetch('http://your-backend:3000/api/simulation/start', { 
    method: 'POST' 
  });
}
```

---

## 📊 Complete Integration Example

### Frontend Integration Code

```javascript
import { getAuth } from 'firebase/auth';

class HealthDataService {
  constructor() {
    this.healthBackendURL = 'http://localhost:3000'; // Your backend
    this.auth = getAuth();
  }

  /**
   * Sync Firebase user to health backend
   */
  async syncUser(firebaseUser) {
    try {
      const response = await fetch(`${this.healthBackendURL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,        // Firebase UID
          role: 'ELDER',
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
        })
      });

      if (!response.ok) {
        // User might already exist, that's okay
        console.log('User might already exist in health backend');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to sync user:', error);
    }
  }

  /**
   * Get current user's latest health data
   */
  async getMyHealthData() {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const response = await fetch(
      `${this.healthBackendURL}/api/health/elder/${user.uid}/latest`
    );
    return await response.json();
  }

  /**
   * Get current user's health history
   */
  async getMyHealthHistory(limit = 20) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const response = await fetch(
      `${this.healthBackendURL}/api/health/elder/${user.uid}/history?limit=${limit}`
    );
    return await response.json();
  }

  /**
   * Get current user's health statistics
   */
  async getMyHealthStats() {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const response = await fetch(
      `${this.healthBackendURL}/api/health/elder/${user.uid}/stats`
    );
    return await response.json();
  }

  /**
   * For caregivers: Get all assigned elders
   */
  async getMyElders() {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const response = await fetch(
      `${this.healthBackendURL}/api/health/caregiver/${user.uid}/elders`
    );
    return await response.json();
  }

  /**
   * Assign caregiver to elder
   */
  async assignCaregiver(elderUID, caregiverUID) {
    const response = await fetch(
      `${this.healthBackendURL}/api/users/elder/${elderUID}/assign-caregiver`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caregiverUID })
      }
    );
    return await response.json();
  }
}

export default new HealthDataService();
```

### Usage in React Component

```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth'; // Your Firebase auth hook
import HealthDataService from './services/HealthDataService';

function MyHealthDashboard() {
  const { user } = useAuth(); // Firebase user
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Sync user to health backend on first load
    HealthDataService.syncUser(user);

    // Fetch health data
    const fetchHealthData = async () => {
      try {
        const result = await HealthDataService.getMyHealthData();
        if (result.success) {
          setHealthData(result.data.healthData);
        }
      } catch (error) {
        console.error('Failed to fetch health data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();

    // Auto-refresh every 2 seconds
    const interval = setInterval(fetchHealthData, 2000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!healthData) return <div>No health data available</div>;

  return (
    <div className="health-dashboard">
      <h1>My Health Status</h1>
      
      <div className={`status-badge ${healthData.health.status}`}>
        {healthData.health.status}
      </div>

      <div className="vitals-grid">
        <div className="vital-card">
          <span>❤️ Heart Rate</span>
          <strong>{healthData.vitals.heartRate} BPM</strong>
        </div>
        
        <div className="vital-card">
          <span>🫁 Blood Oxygen</span>
          <strong>{healthData.vitals.spo2}%</strong>
        </div>
        
        <div className="vital-card">
          <span>🌡️ Temperature</span>
          <strong>{healthData.vitals.temperature}°C</strong>
        </div>
        
        <div className="vital-card">
          <span>😰 Stress</span>
          <strong>{healthData.activity.stress}/100</strong>
        </div>
      </div>

      {healthData.health.alerts.length > 0 && (
        <div className="alerts">
          <h3>⚠️ Alerts</h3>
          {healthData.health.alerts.map((alert, i) => (
            <p key={i}>{alert}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyHealthDashboard;
```

---

## 🔐 Authentication Flow

### Complete Flow with Firebase

```
1. User Registration/Login (Firebase)
   ↓
   Firebase returns user object with UID
   ↓
2. Sync to Health Backend
   POST /api/users { uid: firebaseUID, role: "ELDER", ... }
   ↓
3. Health Backend Creates User
   User stored with Firebase UID
   ↓
4. Simulation Starts Generating Data
   Automatic continuous data generation (every 2s)
   ↓
5. Frontend Fetches Health Data
   GET /api/health/elder/{firebaseUID}/latest
   ↓
6. Display Real-Time Health Data
   Auto-refresh every 2-3 seconds
```

---

## 🎯 Key Points for Integration

### ✅ Your Backend is Already Compatible

1. **UID Flexibility**: Accepts any UID string (Firebase UIDs work perfectly)
2. **No Authentication Required**: Your backend focuses on data generation
3. **Automatic Data Generation**: Simulation runs continuously
4. **Real-Time Updates**: Data updates every 2 seconds

### ✅ What Your Backend Provides

- **Data Template**: Generates realistic health data
- **Continuous Cycling**: Updates every 2 seconds automatically
- **Status Calculation**: Automatic health status determination
- **History Tracking**: Stores up to 100 records per elder
- **Statistics**: Aggregated health metrics

### ✅ What Firebase Provides (Friend's Part)

- **Authentication**: OAuth login/signup
- **User Management**: User accounts and profiles
- **Authorization**: Access control and permissions
- **Security**: Firebase security rules

---

## 🔄 API Endpoints to Use with Firebase UIDs

### For Elder Users

```javascript
// Get my health data (using Firebase UID)
GET /api/health/elder/{firebaseUID}/latest

// Get my health history
GET /api/health/elder/{firebaseUID}/history?limit=20

// Get my statistics
GET /api/health/elder/{firebaseUID}/stats
```

### For Caregiver Users

```javascript
// Get all my assigned elders (using Firebase UID)
GET /api/health/caregiver/{firebaseUID}/elders

// Assign myself to an elder
POST /api/users/elder/{elderFirebaseUID}/assign-caregiver
Body: { caregiverUID: "myFirebaseUID" }
```

---

## 🚀 Quick Integration Checklist

When connecting with Firebase:

- [ ] Replace sample data seeding with Firebase user sync
- [ ] Use Firebase UIDs when creating users in your backend
- [ ] Keep simulation running for continuous data
- [ ] Frontend authenticates with Firebase
- [ ] Frontend fetches health data from your backend using Firebase UID
- [ ] Auto-refresh health data every 2-3 seconds
- [ ] Handle cases where user exists in Firebase but not in health backend yet

---

## 📝 Configuration Updates Needed

### Environment Variables

Add to `.env`:

```env
PORT=3000
NODE_ENV=production

# Firebase configuration (for validation if needed)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key

# Simulation settings
SIMULATION_INTERVAL=2000
AUTO_START_SIMULATION=true
```

### Optional: Disable Sample Data in Production

In `src/server.js`, wrap seeding with environment check:

```javascript
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  
  // Only seed sample data in development
  if (process.env.NODE_ENV !== 'production') {
    seedSampleData();
  }
  
  // Always start simulation
  setTimeout(() => {
    simulationService.start();
  }, 2000);
});
```

---

## 🎨 Frontend Architecture

```
Firebase Auth
    ↓
[Login/Signup] ─→ Get Firebase UID
    ↓
Sync to Health Backend
    ↓
[Dashboard] ─→ Fetch health data using Firebase UID
    ↓
Auto-refresh every 2s
    ↓
Display real-time health status
```

---

## 💡 Best Practices

### 1. User Sync on Authentication

Sync user to health backend immediately after authentication:

```javascript
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User logged in
    await HealthDataService.syncUser(user);
  }
});
```

### 2. Error Handling

Handle cases where user doesn't exist in health backend yet:

```javascript
async function getHealthData(firebaseUID) {
  try {
    const response = await fetch(`/api/health/elder/${firebaseUID}/latest`);
    const result = await response.json();
    
    if (!result.success) {
      // User might not be synced yet
      await syncUserToHealthBackend(firebaseUID);
      // Retry
      return await getHealthData(firebaseUID);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching health data:', error);
  }
}
```

### 3. Real-Time Updates

Use automatic refresh to show cycling data:

```javascript
useEffect(() => {
  const fetchData = async () => {
    const data = await HealthDataService.getMyHealthData();
    setHealthData(data);
  };
  
  fetchData();
  const interval = setInterval(fetchData, 2000); // Match backend interval
  return () => clearInterval(interval);
}, []);
```

---

## 🔍 Testing Integration

### Test Flow

1. **Start Your Backend**
   ```bash
   npm start
   ```

2. **Simulate Firebase Login**
   ```bash
   # Create user with Firebase-like UID
   curl -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{
       "uid": "firebase_testuser123",
       "role": "ELDER",
       "name": "Test User",
       "email": "test@example.com"
     }'
   ```

3. **Fetch Health Data**
   ```bash
   curl http://localhost:3000/api/health/elder/firebase_testuser123/latest
   ```

4. **Verify Continuous Updates**
   ```bash
   # Run this multiple times to see different data
   watch -n 2 curl -s http://localhost:3000/api/health/elder/firebase_testuser123/latest
   ```

---

## ✨ Summary

Your backend is **ready for Firebase integration**:

✅ **UID Compatible**: Works with any UID format (including Firebase)
✅ **Data Template**: Generates continuous cycling health data
✅ **No Auth Needed**: Focuses purely on health data generation
✅ **Real-Time**: Updates every 2 seconds automatically
✅ **Easy Integration**: Just pass Firebase UID to your endpoints

### Integration is Simple:

1. Friend handles authentication (Firebase)
2. Frontend gets Firebase UID after login
3. Sync Firebase user to your backend
4. Your backend generates continuous health data for that UID
5. Frontend fetches health data using the same Firebase UID

**You're all set for seamless Firebase integration!** 🚀

---

**Safe & Sound Backend v2.0** - Firebase-Ready Multi-User Health Monitoring System 🛡️
