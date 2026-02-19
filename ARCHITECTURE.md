# Safe & Sound Backend Architecture v2.0

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT / FRONTEND                         │
│  (Browser, Mobile App, External Services)                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP Requests
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER                            │
│                   (src/app.js)                               │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Middleware Layer                                 │      │
│  │  • CORS                                           │      │
│  │  • JSON Parser                                    │      │
│  │  • Request Logger                                 │      │
│  │  • Error Handler                                  │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Routes Layer                                     │      │
│  │                                                    │      │
│  │  /api/health/*      →  healthRoutes.js           │      │
│  │  /display/*         →  displayRoutes.js          │      │
│  │  /                  →  Redirect to dashboard     │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    ROUTES LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  healthRoutes.js                displayRoutes.js            │
│  ├─ POST   /generate            ├─ GET  /dashboard          │
│  ├─ GET    /latest              └─ GET  /stats              │
│  ├─ GET    /history                                         │
│  ├─ GET    /stats                                           │
│  ├─ POST   /sync                                            │
│  ├─ DELETE /clear                                           │
│  └─ GET    /status                                          │
│                                                              │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTROLLER LAYER                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  healthController.js                                        │
│  ├─ generateData()      → Generate new health data          │
│  ├─ getLatest()         → Retrieve latest record           │
│  ├─ getHistory()        → Get historical data              │
│  ├─ getStats()          → Calculate statistics             │
│  ├─ receiveData()       → Receive external data            │
│  ├─ clearData()         → Clear all records                │
│  └─ checkStatus()       → Check API status                 │
│                                                              │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  dataGenerator.js              statusCalculator.js          │
│  ├─ generateByStatus()         ├─ calculateStatus()         │
│  ├─ generateRandom()           ├─ getStatusColor()          │
│  └─ THRESHOLDS                 └─ getStatusEmoji()          │
│                                                              │
│  Features:                     Features:                    │
│  • Realistic data generation   • Threshold validation       │
│  • Status-based generation     • Alert generation           │
│  • Weighted randomization      • Severity calculation       │
│  • All vitals simulation       • Multi-metric analysis      │
│                                                              │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                     MODEL LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  HealthData.js                                              │
│  ├─ Data Structure                                          │
│  ├─ Validation                                              │
│  ├─ JSON Serialization                                      │
│  └─ Type Definitions                                        │
│                                                              │
│  Properties:                                                │
│  • userId, timestamp                                        │
│  • vitals (HR, SpO2, temp, BP)                             │
│  • motion (gyro, accel)                                     │
│  • activity (steps, calories, stress)                       │
│  • device (wear state, battery)                             │
│  • health (status, alerts)                                  │
│                                                              │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA STORAGE                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  In-Memory Store (Current)                                  │
│  • healthDataStore[]     (max 100 records)                  │
│  • latestData            (most recent)                      │
│                                                              │
│  Future: Database Integration                               │
│  • MongoDB / PostgreSQL                                     │
│  • Persistent storage                                       │
│  • Advanced querying                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### 1. Generate Data Flow

```
Client Request
    │
    ▼
POST /api/health/generate { status: "NORMAL" }
    │
    ▼
healthController.generateData()
    │
    ├─► dataGenerator.generateByStatus("NORMAL")
    │       │
    │       ├─► Create realistic vitals
    │       ├─► Generate motion data
    │       ├─► Calculate activity metrics
    │       └─► Return HealthData object
    │
    ├─► statusCalculator.calculateStatus(data)
    │       │
    │       ├─► Check all thresholds
    │       ├─► Generate alerts
    │       └─► Return status & severity
    │
    ├─► Store in healthDataStore[]
    │
    └─► Return JSON response to client
```

### 2. Get Latest Flow

```
Client Request
    │
    ▼
GET /api/health/latest
    │
    ▼
healthController.getLatest()
    │
    ├─► Retrieve latestData from store
    │
    ├─► Convert to JSON
    │
    └─► Return to client
```

### 3. Statistics Flow

```
Client Request
    │
    ▼
GET /api/health/stats
    │
    ▼
healthController.getStats()
    │
    ├─► Count records by status
    │
    ├─► Calculate averages
    │       │
    │       ├─► Average heart rate
    │       ├─► Average SpO2
    │       ├─► Average temperature
    │       └─► Average stress
    │
    ├─► Include latest data
    │
    └─► Return aggregated stats
```

## 🎯 Status Calculation Logic

```
HealthData Input
    │
    ▼
┌──────────────────────────────┐
│  Check Wear State            │
│  wearState === 0?            │
│  → Status: NOT_WEARING       │
└──────────────────────────────┘
    │ No
    ▼
┌──────────────────────────────┐
│  Check Heart Rate            │
│  < 40 or > 150?  → DANGER    │
│  < 50 or > 120?  → WARNING   │
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│  Check Blood Oxygen          │
│  < 85?  → DANGER             │
│  < 90?  → WARNING            │
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│  Check Temperature           │
│  < 35 or > 39?  → DANGER     │
│  < 35.5 or > 38? → WARNING   │
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│  Check Blood Pressure        │
│  > 160/100?  → DANGER        │
│  > 140/90?   → WARNING       │
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│  Check Stress Level          │
│  ≥ 80?  → DANGER             │
│  ≥ 60?  → WARNING            │
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│  Aggregate Results           │
│  dangerCount > 0  → DANGER   │
│  warningCount > 0 → WARNING  │
│  else             → NORMAL   │
└──────────────────────────────┘
    │
    ▼
Final Status + Alerts
```

## 📊 Component Responsibilities

### Models (`src/models/`)
- **HealthData.js**
  - Define data structure
  - Validate input data
  - Provide JSON serialization
  - Type safety

### Services (`src/services/`)
- **dataGenerator.js**
  - Generate realistic health data
  - Status-based generation
  - Random weighted generation
  - Maintain thresholds

- **statusCalculator.js**
  - Calculate health status
  - Generate alerts
  - Determine severity
  - Multi-metric analysis

### Controllers (`src/controllers/`)
- **healthController.js**
  - Handle business logic
  - Coordinate services
  - Manage data storage
  - Response formatting

### Routes (`src/routes/`)
- **healthRoutes.js**
  - Define API endpoints
  - Route to controllers
  - HTTP method mapping

- **displayRoutes.js**
  - Serve HTML dashboards
  - Render visualizations
  - Static content delivery

## 🔐 Security Layer

```
┌─────────────────────────────┐
│  CORS Policy                │
│  • Origin: *                │
│  • Methods: GET,POST,DELETE │
│  • Headers: Content-Type    │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Input Validation           │
│  • HealthData model         │
│  • Type checking            │
│  • Sanitization             │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Error Handling             │
│  • Try-catch blocks         │
│  • Error middleware         │
│  • Safe responses           │
└─────────────────────────────┘
```

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────┐
│          Load Balancer                  │
└─────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐      ┌──────────────┐
│  Instance 1  │      │  Instance 2  │
│  Node.js     │      │  Node.js     │
│  Express     │      │  Express     │
└──────────────┘      └──────────────┘
        │                     │
        └──────────┬──────────┘
                   ▼
┌─────────────────────────────────────────┐
│          Database (Future)              │
│     MongoDB / PostgreSQL                │
└─────────────────────────────────────────┘
```

## 📈 Scalability Considerations

### Current (v2.0)
- In-memory storage (100 records max)
- Single server instance
- No persistence

### Future Enhancements
1. **Database Integration**
   - MongoDB for flexible schema
   - PostgreSQL for relational data
   - Redis for caching

2. **Horizontal Scaling**
   - Load balancer
   - Multiple instances
   - Session management

3. **Real-time Updates**
   - WebSocket integration
   - Server-sent events
   - Live notifications

4. **Microservices**
   - Data generation service
   - Analysis service
   - Notification service
   - User management service

## 🎨 Design Patterns Used

1. **MVC (Model-View-Controller)**
   - Models: Data structure
   - Views: HTML dashboards
   - Controllers: Business logic

2. **Service Layer Pattern**
   - Separate business logic
   - Reusable services
   - Single responsibility

3. **Repository Pattern (Future)**
   - Abstract data access
   - Easy database switching

4. **Middleware Pattern**
   - Request pipeline
   - Logging, CORS, parsing
   - Error handling

## 📝 Summary

The architecture follows modern best practices:

✅ **Clean separation of concerns**
✅ **Modular and maintainable**
✅ **Easy to test and extend**
✅ **Scalable foundation**
✅ **Production-ready structure**

---

**Safe & Sound Backend v2.0** - Professional Architecture 🏗️
