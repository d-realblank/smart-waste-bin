# Smart Waste Bin System - SOEN 422 Final Project

## Problem Definition

Campus waste management is inefficient; custodians have to check every bin regularly, and waste management often means emptying bins (which are far from full) or missing overflowing bins. This results in unnecessary labour, wastage of resources and poor hygiene conditions on campus.

## Proposed Solution

A distributed IoT system using sensor-enabled bins with LilyGO TTGO microcontrollers and ultrasonic sensors to detect waste levels in real-time. The system optimizes collection routes and sends alerts to custodians through a web dashboard.

## System Architecture

The system uses a **Gateway-Node** topology to extend range and reduce power consumption.

```
[Remote Bin (BLE Node)]  --BLE-->  [Gateway Bin (WiFi + BLE)]  --WiFi/HTTP-->  [Server]  <-->  [Dashboard]
      (Battery Powered)                   (Mains/Battery)                         (DB)
```

- **Gateway Bin**: Connects to WiFi and relays its own data + data from nearby BLE nodes to the server.
- **Remote Bin**: Operates in low-power mode, advertising sensor data via BLE to be picked up by a Gateway.

## Key Features

- **Unified Firmware**: Single firmware (`bin-node`) automatically detects WiFi availability to switch between **Gateway Mode** and **BLE Node Mode**.
- **Dynamic Location**: Bins transmit their configured location name wirelessly; no hardcoding required on the server.
- **Real-time Monitoring**: Ultrasonic sensors detect bin fill levels (0-100%).
- **Smart Alerts**: Automatic generation of alerts for "Full" bins or "Low Battery", pushed instantly to the dashboard via WebSockets.
- **Web Dashboard**: React-based interface for monitoring bin status, managing alerts, and viewing analytics.

## Project Structure

```
smart-waste-bin/
├── bin-node/              # Unified Firmware (Gateway + BLE Node)
│   ├── bin-node.ino       # Main logic (Auto-switching modes)
│   ├── config.h           # Configuration (ID, Location, WiFi)
│   └── README.md          # Hardware setup guide
├── server/                # Backend REST API (Node.js/Express)
│   ├── src/
│   │   ├── controllers/   # Logic for Bins, Alerts, Auth
│   │   ├── models/        # MongoDB Schemas (Bin, Alert, History)
│   │   ├── routes/        # API Endpoints
│   │   └── server.js      # Entry point
│   └── package.json
├── dashboard/             # Web Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # UI Components
│   │   ├── pages/         # Dashboard Views
│   │   └── context/       # Auth & Socket Context
│   └── package.json
└── docs/                  # Documentation
```

## Hardware Requirements

- **LilyGO TTGO T3 LoRa32 V1.6.1** (ESP32 + OLED)
- **HC-SR04 Ultrasonic Sensor**
- **Micro-USB Cable** (for programming and power)
- **Battery (Optional)**: 3.7V LiPo for Remote Nodes

## Software Stack

### Firmware
- **Platform**: Arduino (ESP32)
- **Libraries**: `WiFi`, `HTTPClient`, `ArduinoJson`, `U8g2` (OLED), `BLEDevice`

### Server
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Real-time**: Socket.IO

### Dashboard
- **Framework**: React (Vite)
- **UI Library**: Material-UI (MUI)
- **HTTP Client**: Axios

## Quick Start

### 1. Server Setup
```bash
cd server
npm install
# Ensure MongoDB is running
npm run dev
```

### 2. Dashboard Setup
```bash
cd dashboard
npm install
npm run dev
```

### 3. Firmware Setup
1. Open `bin-node/config.h`.
2. Configure `WIFI_SSID` and `WIFI_PASSWORD`.
3. Set `BIN_ID` and `BIN_LOCATION`.
4. Upload to your ESP32 board.
   - **Gateway**: Will connect to WiFi and show "GW: -xx dBm".
   - **Node**: If WiFi fails, will switch to "Mode: BLE Node".

## API Documentation

See `docs/API.md` for detailed endpoint descriptions.
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

