# Smart Waste Bin System - API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

### API Key (for bin nodes)
Include in request header:
```
X-API-Key: your-api-key-here
```

### JWT Token (for dashboard)
Include in request header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTODIAN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "CUSTODIAN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Bin Endpoints

### Get All Bins
```http
GET /api/bins
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status (NORMAL, WARNING, FULL, ERROR, OFFLINE)
- `location` - Filter by location (partial match)
- `isActive` - Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "...",
      "binId": "BIN_001",
      "location": "Engineering Building",
      "fillLevel": 75,
      "status": "WARNING",
      "batteryLevel": 85,
      "lastUpdate": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Bin by ID
```http
GET /api/bins/:binId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "binId": "BIN_001",
    "location": "Engineering Building",
    "fillLevel": 75,
    "distance": 25,
    "status": "WARNING",
    "isFull": false,
    "batteryLevel": 85,
    "rssi": -65,
    "lastUpdate": "2024-01-15T10:30:00.000Z",
    "lastEmptied": "2024-01-14T08:00:00.000Z"
  }
}
```

### Update Bin Status (from bin node)
```http
POST /api/bins/status
X-API-Key: <api-key>
```

**Request Body:**
```json
{
  "binId": "BIN_001",
  "fillLevel": 75.5,
  "distance": 24.5,
  "status": "WARNING",
  "batteryLevel": 85,
  "rssi": -65
}
```

**Response:**
```json
{
  "success": true,
  "message": "Status updated successfully",
  "data": { ... }
}
```

### Create Alert (from bin node)
```http
POST /api/bins/alert
X-API-Key: <api-key>
```

**Request Body:**
```json
{
  "binId": "BIN_001",
  "alertType": "BIN_FULL",
  "message": "Bin has reached full capacity",
  "priority": "HIGH",
  "fillLevel": 95
}
```

### Mark Bin as Emptied
```http
POST /api/bins/:binId/empty
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Bin marked as emptied",
  "data": { ... }
}
```

### Get Bin History
```http
GET /api/bins/:binId/history?days=7
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 2016,
  "data": [
    {
      "binId": "BIN_001",
      "fillLevel": 75,
      "distance": 25,
      "status": "WARNING",
      "batteryLevel": 85,
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## Alert Endpoints

### Get All Alerts
```http
GET /api/alerts
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - ACTIVE, ACKNOWLEDGED, RESOLVED
- `priority` - LOW, MEDIUM, HIGH, CRITICAL
- `binId` - Filter by bin ID

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "binId": "BIN_001",
      "alertType": "BIN_FULL",
      "priority": "HIGH",
      "message": "Bin has reached full capacity",
      "status": "ACTIVE",
      "fillLevel": 95,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Active Alerts
```http
GET /api/alerts/active
Authorization: Bearer <token>
```

### Acknowledge Alert
```http
PUT /api/alerts/:id/acknowledge
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Alert acknowledged",
  "data": { ... }
}
```

### Resolve Alert
```http
PUT /api/alerts/:id/resolve
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notes": "Bin has been emptied"
}
```

---

## Route Endpoints

### Get All Routes
```http
GET /api/routes
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - PLANNED, IN_PROGRESS, COMPLETED, CANCELLED

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "routeName": "High Priority Route",
      "bins": [
        {
          "binId": "BIN_001",
          "order": 1,
          "estimatedTime": 5
        }
      ],
      "status": "PLANNED",
      "scheduledDate": "2024-01-15T00:00:00.000Z",
      "estimatedDuration": 25
    }
  ]
}
```

### Get Today's Routes
```http
GET /api/routes/today
Authorization: Bearer <token>
```

### Optimize Route
```http
GET /api/routes/optimize
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bins": [
      {
        "binId": "BIN_003",
        "order": 1,
        "fillLevel": 95,
        "location": "Library"
      },
      {
        "binId": "BIN_001",
        "order": 2,
        "fillLevel": 85,
        "location": "Engineering Building"
      }
    ],
    "estimatedDuration": 30,
    "totalDistance": 450,
    "count": 6
  }
}
```

### Create Route
```http
POST /api/routes
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "routeName": "Morning Collection",
  "bins": [
    {
      "binId": "BIN_001",
      "order": 1,
      "estimatedTime": 5
    }
  ],
  "scheduledDate": "2024-01-16T08:00:00.000Z",
  "priority": "HIGH"
}
```

### Start Route
```http
POST /api/routes/:id/start
Authorization: Bearer <token>
```

### Complete Bin in Route
```http
POST /api/routes/:id/complete-bin
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "binId": "BIN_001",
  "fillLevel": 95,
  "notes": "Full load, took 7 minutes"
}
```

### Cancel Route
```http
POST /api/routes/:id/cancel
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Vehicle malfunction"
}
```

---

## Dashboard Endpoints

### Get Overview
```http
GET /api/dashboard/overview
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBins": 25,
    "fullBins": 3,
    "warningBins": 5,
    "activeAlerts": 8,
    "criticalAlerts": 2,
    "activeroutes": 1,
    "avgFillLevel": 62.5,
    "binsByStatus": [
      { "_id": "NORMAL", "count": 15 },
      { "_id": "WARNING", "count": 5 },
      { "_id": "FULL", "count": 3 }
    ]
  }
}
```

### Get Statistics
```http
GET /api/dashboard/stats?period=7
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "collections": {
      "total": 45,
      "avgTime": 23,
      "completedRoutes": 9
    },
    "alerts": {
      "total": 32,
      "resolved": 28,
      "resolutionRate": 88
    },
    "trends": [
      {
        "_id": { "date": "2024-01-14" },
        "avgFillLevel": 58.5,
        "maxFillLevel": 95
      }
    ]
  }
}
```

---

## WebSocket Events

### Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected');
});
```

### Subscribe to Bin Updates
```javascript
socket.emit('subscribe', 'BIN_001');
```

### Listen for Events

#### Bin Update
```javascript
socket.on('binUpdate', (data) => {
  console.log('Bin updated:', data);
});
```

#### New Alert
```javascript
socket.on('newAlert', (alert) => {
  console.log('New alert:', alert);
});
```

#### Bin Emptied
```javascript
socket.on('binEmptied', (bin) => {
  console.log('Bin emptied:', bin);
});
```

#### Route Started
```javascript
socket.on('routeStarted', (route) => {
  console.log('Route started:', route);
});
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": ["Field 'binId' is required"]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No authentication token provided"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Bin not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## Rate Limiting

Currently not implemented. Consider adding rate limiting for production:
- 100 requests per minute per IP for authenticated users
- 20 requests per minute for unauthenticated endpoints

---

## Pagination

For large datasets, implement pagination:

```http
GET /api/bins?page=1&limit=20
```

---

## Testing

### Using curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get bins (with token)
curl http://localhost:3000/api/bins \
  -H "Authorization: Bearer <token>"

# Update bin status (with API key)
curl -X POST http://localhost:3000/api/bins/status \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"binId":"BIN_001","fillLevel":75,"distance":25,"status":"WARNING","batteryLevel":85,"rssi":-65}'
```

### Using Postman

1. Import collection (create from this documentation)
2. Set environment variables:
   - `base_url`: http://localhost:3000/api
   - `token`: <your-jwt-token>
   - `api_key`: <your-api-key>
3. Test all endpoints

---

## Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (httpOnly cookies recommended)
3. **Implement request validation** on client side
4. **Handle errors gracefully**
5. **Use WebSockets for real-time updates**
6. **Cache frequently accessed data**
7. **Implement proper logging**
8. **Monitor API performance**
