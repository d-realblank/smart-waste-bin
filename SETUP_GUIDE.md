# Smart Waste Bin System - Complete Setup Guide

## Quick Start (Without Hardware)

This guide helps you set up and test the complete system without physical hardware components.

## Prerequisites

- **Node.js** v18+ installed
- **MongoDB** installed (or MongoDB Atlas account)
- Basic terminal/command line knowledge
- Code editor (VS Code recommended)

---

## Step 1: Project Setup

### Clone or Extract Project
```bash
cd ~/SOEN422Final
```

Your project structure should look like:
```
SOEN422Final/
├── bin-node/          # Arduino firmware (for when hardware arrives)
├── server/            # Backend API
├── dashboard/         # Web interface
├── docs/              # Documentation
└── README.md
```

---

## Step 2: Database Setup

### Option A: Local MongoDB

**macOS:**
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

**Windows:**
1. Download and install MongoDB Community Server from the [official website](https://www.mongodb.com/try/download/community).
2. Install `mongosh` (MongoDB Shell) if not included or via npm:
```bash
npm install -g mongosh
```

**Verify Installation:**
```bash
# Verify it's running
mongosh
# Should connect successfully
```

### Option B: MongoDB Atlas (Cloud - Free Tier)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free account
3. Create cluster (M0 Free tier)
4. Create database user:
   - Username: `admin`
   - Password: `password123`
5. Add IP whitelist: `0.0.0.0/0` (allow all IPs)
6. Get connection string:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password

---

## Step 3: Server Setup

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Edit server/.env

For local MongoDB:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/smart-waste-bin
JWT_SECRET=my-super-secret-jwt-key-change-in-production-12345
JWT_EXPIRE=7d
API_KEY=test-api-key-for-bins
DASHBOARD_URL=http://localhost:3001
```

For MongoDB Atlas:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://admin:password123@cluster0.xxxxx.mongodb.net/smart-waste-bin?retryWrites=true&w=majority
JWT_SECRET=my-super-secret-jwt-key-change-in-production-12345
JWT_EXPIRE=7d
API_KEY=test-api-key-for-bins
DASHBOARD_URL=http://localhost:3001
```

### Create Admin User Script

Create `server/src/scripts/seedDatabase.js`:

```javascript
const mongoose = require('mongoose');
const User = require('../models/User');
const Bin = require('../models/Bin');
require('dotenv').config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        // Create admin user
        await User.deleteMany({});
        const admin = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'ADMIN',
            firstName: 'Admin',
            lastName: 'User'
        });
        console.log('✅ Admin user created: admin / admin123');
        
        // Create custodian user
        const custodian = await User.create({
            username: 'custodian',
            email: 'custodian@example.com',
            password: 'custodian123',
            role: 'CUSTODIAN',
            firstName: 'John',
            lastName: 'Custodian'
        });
        console.log('✅ Custodian user created: custodian / custodian123');
        
        // Create sample bins
        await Bin.deleteMany({});
        const sampleBins = [
            {
                binId: 'BIN_001',
                location: 'Engineering Building - Main Entrance',
                fillLevel: 85,
                distance: 15,
                status: 'FULL',
                batteryLevel: 75,
                coordinates: { latitude: 45.4972, longitude: -73.5794 },
                capacity: 120,
                binHeight: 100
            },
            {
                binId: 'BIN_002',
                location: 'Library - Ground Floor',
                fillLevel: 65,
                distance: 35,
                status: 'WARNING',
                batteryLevel: 90,
                coordinates: { latitude: 45.4975, longitude: -73.5790 },
                capacity: 100,
                binHeight: 90
            },
            {
                binId: 'BIN_003',
                location: 'Cafeteria - Main Hall',
                fillLevel: 95,
                distance: 5,
                status: 'FULL',
                batteryLevel: 60,
                coordinates: { latitude: 45.4970, longitude: -73.5798 },
                capacity: 150,
                binHeight: 110
            },
            {
                binId: 'BIN_004',
                location: 'Science Building - 3rd Floor',
                fillLevel: 30,
                distance: 70,
                status: 'NORMAL',
                batteryLevel: 95,
                coordinates: { latitude: 45.4978, longitude: -73.5792 },
                capacity: 100,
                binHeight: 100
            },
            {
                binId: 'BIN_005',
                location: 'Student Center',
                fillLevel: 45,
                distance: 55,
                status: 'NORMAL',
                batteryLevel: 85,
                coordinates: { latitude: 45.4968, longitude: -73.5796 },
                capacity: 120,
                binHeight: 100
            }
        ];
        
        await Bin.insertMany(sampleBins);
        console.log('✅ Sample bins created');
        
        console.log('\n=== Database Seeded Successfully ===\n');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed();
```

### Run Seed Script

```bash
node src/scripts/seedDatabase.js
```

You should see:
```
✅ Admin user created: admin / admin123
✅ Custodian user created: custodian / custodian123
✅ Sample bins created
=== Database Seeded Successfully ===
```

### Start Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# Or regular mode
npm start
```

You should see:
```
=================================
🚀 Server running on port 3000
📊 Environment: development
🌐 API URL: http://localhost:3000
=================================
```

Test server: Open http://localhost:3000 in browser

---

## Step 4: Dashboard Setup

Open new terminal:

```bash
cd dashboard

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Edit dashboard/.env

```env
VITE_API_URL=http://localhost:3000
VITE_MAP_CENTER_LAT=45.4972
VITE_MAP_CENTER_LNG=-73.5794
```

### Start Dashboard

```bash
npm run dev
```

You should see:
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:3001/
➜  Network: use --host to expose
```

Open http://localhost:3001 in browser

---

## Step 5: Test the System

### Login to Dashboard

1. Go to http://localhost:3001
2. Login with:
   - Username: `admin`
   - Password: `admin123`

### Verify Dashboard Works

You should see:
- Total bins: 5
- Full bins: 2
- Warning bins: 1
- Various statistics

### Test API Manually

```bash
# Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Copy the token from response

# Get all bins (replace <TOKEN> with actual token)
curl http://localhost:3000/api/bins \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Step 6: Simulate Bin Updates (Without Hardware)

### Create Test Script

Create `server/test-bin-simulation.js`:

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const API_KEY = 'test-api-key-for-bins';

async function simulateBinUpdate(binId, fillLevel) {
    try {
        const response = await axios.post(`${API_URL}/bins/status`, {
            binId,
            fillLevel,
            distance: 100 - fillLevel,
            status: fillLevel >= 85 ? 'FULL' : fillLevel >= 70 ? 'WARNING' : 'NORMAL',
            batteryLevel: Math.floor(Math.random() * 30) + 70,
            rssi: Math.floor(Math.random() * 20) - 70
        }, {
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`✅ Updated ${binId}: ${fillLevel}%`);
    } catch (error) {
        console.error(`❌ Error updating ${binId}:`, error.message);
    }
}

async function runSimulation() {
    console.log('🚀 Starting bin simulation...\n');
    
    const bins = ['BIN_001', 'BIN_002', 'BIN_003', 'BIN_004', 'BIN_005'];
    
    // Simulate updates every 5 seconds
    setInterval(async () => {
        for (const binId of bins) {
            // Random fill level between current and current + 5
            const fillLevel = Math.min(100, Math.floor(Math.random() * 5) + 50);
            await simulateBinUpdate(binId, fillLevel);
        }
        console.log('\n--- Update cycle complete ---\n');
    }, 5000);
    
    // Initial update
    for (const binId of bins) {
        await simulateBinUpdate(binId, Math.floor(Math.random() * 50) + 30);
    }
}

runSimulation();
```

### Run Simulation

```bash
cd server
node test-bin-simulation.js
```

Watch the dashboard update in real-time!

---

## Step 7: Test Full Workflow

### 1. View Bins
- Go to dashboard
- Navigate to "Bins" page (when implemented)
- See all bins with status

### 2. Generate Alerts
- Run simulation until a bin reaches 85%+
- Alert should appear in dashboard
- Check "Alerts" page

### 3. Create Collection Route
```bash
# Get optimized route
curl http://localhost:3000/api/routes/optimize \
  -H "Authorization: Bearer <TOKEN>"

# Create route
curl -X POST http://localhost:3000/api/routes \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "routeName": "Test Morning Route",
    "bins": [
      {"binId": "BIN_001", "order": 1, "estimatedTime": 5},
      {"binId": "BIN_003", "order": 2, "estimatedTime": 5}
    ],
    "scheduledDate": "2024-01-20T08:00:00.000Z",
    "priority": "HIGH"
  }'
```

### 4. Test WebSocket Updates
- Open browser console on dashboard
- Run bin simulation
- Watch real-time updates in console and UI

---

## Common Issues & Solutions

### Server won't start
```bash
# Check if MongoDB is running
mongosh

# Check if port 3000 is in use
lsof -i :3000
kill -9 <PID>  # if needed

# Check environment variables
cat server/.env
```

### Dashboard won't connect
```bash
# Verify server is running
curl http://localhost:3000/health

# Check CORS settings
# Make sure DASHBOARD_URL in server/.env matches dashboard URL

# Clear browser cache
# Open dashboard in incognito mode
```

### Database connection failed
```bash
# For local MongoDB:
brew services restart mongodb-community

# For MongoDB Atlas:
# Check connection string
# Verify IP whitelist includes 0.0.0.0/0
# Check username/password
```

### "Cannot find module" errors
```bash
# Reinstall dependencies
cd server
rm -rf node_modules package-lock.json
npm install

cd ../dashboard
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

### When Hardware Arrives

1. **Flash Firmware**
   - Open `bin-node/bin-node.ino` in Arduino IDE
   - Configure `bin-node/config.h` with WiFi and server details
   - Upload to TTGO board
   - See `bin-node/README.md` for detailed instructions

2. **Install Bin Node**
   - Mount ultrasonic sensor
   - Connect to power
   - Verify communication with server

3. **Deploy to Production**
   - Follow `docs/DEPLOYMENT.md`
   - Set up proper domain and SSL
   - Configure proper security

### Expand Features

- Complete bin management pages
- Add map visualization
- Implement analytics charts
- Add email/SMS notifications
- Create mobile app
- Add predictive analytics

---

## Helpful Commands

```bash
# Server
cd server
npm run dev          # Development mode
npm start            # Production mode
npm run lint         # Check code

# Dashboard
cd dashboard
npm run dev          # Development mode
npm run build        # Build for production
npm run preview      # Preview production build

# Database
mongosh                              # Connect to MongoDB
use smart-waste-bin                  # Use database
db.bins.find()                       # List all bins
db.alerts.find()                     # List all alerts
db.users.find()                      # List all users

# Clear all data
db.bins.deleteMany({})
db.alerts.deleteMany({})
db.collectionroutes.deleteMany({})
db.binhistories.deleteMany({})
```

---

## Project Demonstration

For demonstration without hardware:

1. **Start all services**
   - MongoDB running
   - Server running (port 3000)
   - Dashboard running (port 3001)
   - Bin simulation running

2. **Show key features**
   - Login to dashboard
   - View bin status overview
   - Show real-time updates (simulation)
   - Demonstrate alert generation
   - Show route optimization
   - Display analytics

3. **Explain architecture**
   - Show bin node firmware code
   - Explain server API structure
   - Walk through database schema
   - Demonstrate WebSocket communication
   - Discuss route optimization algorithm

---

## Resources

- **MongoDB**: https://www.mongodb.com/docs/
- **Node.js**: https://nodejs.org/docs/
- **React**: https://react.dev/
- **Express**: https://expressjs.com/
- **Arduino ESP32**: https://docs.espressif.com/
- **Socket.IO**: https://socket.io/docs/

---

## Support

For questions or issues:

1. Check documentation in `docs/` folder
2. Review console errors
3. Check server logs
4. Verify environment configuration
5. Test individual components

---

## Conclusion

You now have a fully functional Smart Waste Bin System running without hardware! The system demonstrates:

- ✅ Real-time bin monitoring
- ✅ Alert generation and management  
- ✅ Route optimization
- ✅ Web dashboard interface
- ✅ WebSocket communication
- ✅ Database integration
- ✅ RESTful API

When your hardware arrives, you can simply flash the firmware and deploy the physical bin nodes!
