# Smart Waste Bin System - SOEN 422 Final Project

## Problem Definition

Campus waste management is inefficient; custodians have to check every bin regularly, and waste management often means emptying bins (which are far from full) or missing overflowing bins. This results in unnecessary labour, wastage of resources and poor hygiene conditions on campus.

## Proposed Solution

A distributed IoT system using sensor-enabled bins with LilyGO TTGO microcontrollers and ultrasonic sensors to detect waste levels in real-time. The system optimizes collection routes and sends alerts to custodians through a web dashboard.

## System Architecture

```
Waste Bin Nodes (TTGO) → WiFi/Bluetooth Mesh → Campus Server (REST API) → Web Dashboard
      ↓                                                ↓
  LCD Display                                     Database
  Ultrasonic Sensor                          (Bin Status, Alerts, Routes)
```

## Key Features

- **Real-time monitoring**: Ultrasonic sensors detect bin fill levels
- **Wireless communication**: WiFi for uplink/downlink, Bluetooth mesh for bin-to-bin
- **Smart alerts**: Automatic notifications when bins reach capacity
- **Route optimization**: AI-driven collection route planning
- **Web dashboard**: Real-time visualization and management interface
- **Scalable architecture**: Support for multiple bin nodes

## Project Structure

```
SOEN422Final/
├── bin-node/              # TTGO microcontroller code (Arduino/C++)
│   ├── bin-node.ino       # Main firmware
│   ├── config.h           # Configuration constants
│   └── README.md          # Hardware setup guide
├── server/                # Backend REST API (Node.js/Express)
│   ├── src/
│   │   ├── controllers/   # API controllers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── server.js      # Entry point
│   ├── package.json
│   └── .env.example
├── dashboard/             # Web frontend (React)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page views
│   │   ├── services/      # API client
│   │   └── App.jsx        # Main app component
│   ├── package.json
│   └── .env.example
└── docs/                  # Additional documentation
    ├── API.md             # API documentation
    ├── HARDWARE.md        # Hardware setup guide
    └── DEPLOYMENT.md      # Deployment instructions
```

## Hardware Requirements

- **LilyGO TTGO T-Display** (ESP32-based, 1 per bin)
- **HC-SR04 Ultrasonic Sensor** (1 per bin)
- **Built-in WiFi** (integrated in TTGO)
- **Built-in LCD Display** (integrated in TTGO)
- **Battery Pack** (rechargeable, optional for wireless operation)
- **Enclosure** (weatherproof for outdoor deployment)

## Software Stack

### Bin Node
- **Language**: Arduino C++
- **Platform**: ESP32 (TTGO)
- **Libraries**: WiFi.h, TFT_eSPI, BLEMesh

### Server
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB or PostgreSQL
- **Real-time**: Socket.IO

### Dashboard
- **Framework**: React
- **State Management**: Redux or Context API
- **UI Library**: Material-UI or Tailwind CSS
- **Charts**: Chart.js or Recharts

## Quick Start (Without Hardware)

**Complete setup guide**: See `SETUP_GUIDE.md` for detailed instructions

```bash
# 1. Server Setup (5 minutes)
cd server
npm install
cp .env.example .env
# Edit .env with your database URI
npm run dev

# 2. Dashboard Setup (3 minutes)
cd dashboard
npm install
cp .env.example .env
npm run dev

# 3. Access Dashboard
# Open http://localhost:3001
# Login: admin / admin123
```

**Test without hardware**: Run the bin simulation script included in `SETUP_GUIDE.md`

## Full Documentation

- **SETUP_GUIDE.md** - Complete setup without hardware (30 minutes)
- **docs/DEPLOYMENT.md** - Production deployment guide
- **docs/API.md** - Complete API reference
- **PROJECT_SUMMARY.md** - Comprehensive project overview
- **DELIVERABLES.md** - Complete checklist of deliverables

## Communication Protocol

### Uplink (Bin → Server)
- **Status Update**: Periodic (every 5 minutes)
- **Alert**: Immediate when bin reaches 80% capacity
- **Health Check**: Response to server ping

### Downlink (Server → Bin)
- **Configuration Update**: New reporting intervals
- **System Health Query**: Request bin diagnostics
- **Firmware Update Notification**: OTA update availability

## Data Flow

1. **Bin Node** measures fill level via ultrasonic sensor
2. **Local Display** shows current status on LCD
3. **WiFi Transmission** sends data to campus server
4. **Server Processing** stores data, analyzes trends, optimizes routes
5. **Dashboard Update** reflects real-time status via WebSocket
6. **Alert Generation** notifies custodians when action needed

## Route Optimization

The system uses a modified Traveling Salesman Problem (TSP) algorithm prioritizing:
- Bins above 80% capacity (urgent)
- Geographic proximity (efficiency)
- Historical fill patterns (prediction)

## Future Enhancements

- Machine learning for predictive fill patterns
- Solar panel integration for sustainable power
- Mobile app for custodians
- Integration with campus facility management system
- Environmental sensors (temperature, odor detection)

## Contributors

SOEN 422 Final Project Team

## License

MIT License - Educational Project
