# Smart Waste Bin System - Deployment Guide

## Prerequisites

### Software Requirements
- **Node.js** v18.0.0 or higher
- **MongoDB** v6.0 or higher (local or MongoDB Atlas)
- **Git** for version control
- **Arduino IDE** 1.8.x or 2.x (for bin node firmware)

### Hardware Requirements (per bin)
- LilyGO TTGO T-Display ESP32
- HC-SR04 Ultrasonic Sensor
- USB-C cable for programming
- Power supply (USB battery bank or LiPo battery)

## Server Deployment

### 1. Database Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB
brew install mongodb-community  # macOS
# or follow instructions at https://www.mongodb.com/docs/manual/installation/

# Start MongoDB
brew services start mongodb-community

# Verify running
mongosh
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Configure network access (allow your IP)
4. Create database user
5. Get connection string

### 2. Server Installation

```bash
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Edit with your settings
```

### 3. Configure Environment Variables

Edit `server/.env`:

```env
# Server
NODE_ENV=production
PORT=3000

# Database (choose one)
# Local:
MONGODB_URI=mongodb://localhost:27017/smart-waste-bin

# MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-waste-bin

# JWT
JWT_SECRET=your-random-secret-key-change-this
JWT_EXPIRE=7d

# API Key (for bin nodes)
API_KEY=secure-api-key-for-bins

# Dashboard
DASHBOARD_URL=http://localhost:3001
```

### 4. Seed Database (Optional)

Create initial admin user:

```bash
node src/scripts/seedDatabase.js
```

Create `server/src/scripts/seedDatabase.js`:

```javascript
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User'
    });
    
    console.log('✅ Database seeded');
    process.exit(0);
}

seed();
```

### 5. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

Verify server: http://localhost:3000

## Dashboard Deployment

### 1. Dashboard Installation

```bash
cd dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Edit with your settings
```

### 2. Configure Environment

Edit `dashboard/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_MAP_CENTER_LAT=45.4972
VITE_MAP_CENTER_LNG=-73.5794
```

### 3. Start Dashboard

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Access dashboard: http://localhost:3001

Default credentials: `admin` / `admin123`

## Bin Node Deployment

### 1. Hardware Assembly

1. Connect HC-SR04 to TTGO:
   - VCC → 5V
   - GND → GND
   - TRIG → GPIO 32
   - ECHO → GPIO 33

2. Power TTGO via USB

### 2. Configure Firmware

Edit `bin-node/config.h`:

```cpp
#define WIFI_SSID "YourNetworkName"
#define WIFI_PASSWORD "YourPassword"
#define SERVER_URL "http://192.168.1.100:3000"  // Your server IP
#define API_KEY "secure-api-key-for-bins"       // Same as server
#define BIN_ID "BIN_001"                        // Unique per bin
#define BIN_LOCATION "Engineering Building"
```

### 3. Upload Firmware

1. Open `bin-node.ino` in Arduino IDE
2. Select board: Tools → Board → ESP32 Dev Module
3. Select port: Tools → Port → (your USB port)
4. Click Upload
5. Monitor: Tools → Serial Monitor (115200 baud)

### 4. Physical Installation

1. Mount sensor at top of bin (center, facing down)
2. Secure TTGO board in weatherproof enclosure
3. Connect power supply
4. Verify display shows status
5. Check server logs for incoming data

## Production Deployment

### Option 1: Linux Server (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
# Follow: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/

# Install PM2 for process management
sudo npm install -g pm2

# Clone repository
git clone <your-repo-url>
cd SOEN422Final

# Setup server
cd server
npm install
cp .env.example .env
nano .env  # Configure

# Start with PM2
pm2 start src/server.js --name smart-bin-server
pm2 save
pm2 startup

# Setup dashboard
cd ../dashboard
npm install
npm run build

# Serve with nginx or serve static files
sudo npm install -g serve
pm2 start "serve -s dist -p 3001" --name smart-bin-dashboard
```

### Option 2: Docker Deployment

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    restart: always
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  server:
    build: ./server
    restart: always
    ports:
      - "3000:3000"
    environment:
      MONGODB_URI: mongodb://admin:password@mongodb:27017/smart-waste-bin?authSource=admin
      JWT_SECRET: your-secret
      API_KEY: your-api-key
    depends_on:
      - mongodb

  dashboard:
    build: ./dashboard
    restart: always
    ports:
      - "3001:3001"
    environment:
      VITE_API_URL: http://localhost:3000

volumes:
  mongo-data:
```

Deploy:

```bash
docker-compose up -d
```

### Option 3: Cloud Platforms

#### Heroku
```bash
# Server
cd server
heroku create smart-bin-server
heroku addons:create mongolab
git push heroku main

# Dashboard (use Netlify or Vercel for static hosting)
```

#### AWS EC2
1. Launch EC2 instance (Ubuntu)
2. Configure security groups (ports 3000, 3001, 22)
3. SSH into instance
4. Follow Linux server instructions above
5. Configure Elastic IP for static IP

#### Azure App Service
1. Create Web App resource
2. Deploy server as Node.js app
3. Use Azure Cosmos DB for MongoDB API
4. Deploy dashboard to Azure Static Web Apps

## Network Configuration

### Port Forwarding (for remote access)

If server is on local network:

1. Access router admin panel
2. Forward port 3000 to server IP
3. Forward port 3001 to dashboard IP (if separate)
4. Use Dynamic DNS service for domain name

### Firewall Configuration

```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
```

## SSL/TLS Configuration (HTTPS)

### Using Nginx as Reverse Proxy

```bash
sudo apt install nginx certbot python3-certbot-nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/smart-bin

# Add:
server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3001;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/smart-bin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

## Monitoring & Maintenance

### Server Health Check

```bash
# Check if services are running
pm2 status

# View logs
pm2 logs smart-bin-server

# Restart services
pm2 restart all
```

### Database Backup

```bash
# Create backup
mongodump --uri="mongodb://localhost:27017/smart-waste-bin" --out=/backup/$(date +%Y%m%d)

# Restore backup
mongorestore --uri="mongodb://localhost:27017/smart-waste-bin" /backup/20231201
```

### Automated Backups

Add to crontab:

```bash
crontab -e

# Daily backup at 2 AM
0 2 * * * mongodump --uri="mongodb://localhost:27017/smart-waste-bin" --out=/backup/$(date +\%Y\%m\%d)
```

## Troubleshooting

### Server won't start
- Check MongoDB is running: `mongosh`
- Verify environment variables: `cat .env`
- Check logs: `npm run dev` for detailed errors

### Dashboard can't connect to server
- Verify CORS settings in server
- Check VITE_API_URL in dashboard/.env
- Test API: `curl http://localhost:3000/health`

### Bin nodes not connecting
- Verify WiFi credentials
- Check server URL (use IP, not localhost)
- Verify API_KEY matches server
- Monitor serial output for errors

### WebSocket disconnections
- Check firewall allows WebSocket connections
- Verify Socket.IO configuration
- Check reverse proxy WebSocket settings

## Security Recommendations

1. **Change default credentials** immediately
2. **Use strong JWT_SECRET** (32+ random characters)
3. **Rotate API_KEY** periodically
4. **Enable HTTPS** in production
5. **Restrict MongoDB** access (firewall, authentication)
6. **Keep dependencies updated**: `npm audit fix`
7. **Monitor logs** for suspicious activity
8. **Implement rate limiting** on API endpoints

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Deploy multiple server instances
- Use Redis for session storage
- MongoDB replica set for high availability

### Performance Optimization
- Enable MongoDB indexing
- Implement caching (Redis)
- Use CDN for dashboard static files
- Optimize bin report intervals
- Archive old data regularly

## Support

For issues:
1. Check logs
2. Review documentation
3. Test components individually
4. Verify network connectivity
5. Check GitHub issues

## Next Steps

After deployment:
1. Create backup schedule
2. Set up monitoring (Uptime Robot, Prometheus)
3. Configure email/SMS alerts
4. Train custodian staff
5. Gather feedback and iterate
