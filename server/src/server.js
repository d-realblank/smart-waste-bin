// ============================================================================
// Smart Waste Bin System - Server Entry Point
// ============================================================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIO = require('socket.io');

// Import routes
const binRoutes = require('./routes/binRoutes');
const alertRoutes = require('./routes/alertRoutes');
const routeRoutes = require('./routes/routeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

// Import services
const { startScheduledTasks } = require('./services/schedulerService');

// ============================================================================
// Initialize Express App
// ============================================================================
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ['GET', 'POST']
    }
});

// ============================================================================
// Middleware
// ============================================================================
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Make io accessible to routes
app.set('io', io);

// ============================================================================
// Database Connection
// ============================================================================
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

// ============================================================================
// WebSocket Connection
// ============================================================================
io.on('connection', (socket) => {
    console.log('🔌 New WebSocket client connected:', socket.id);
    
    socket.on('subscribe', (binId) => {
        socket.join(`bin_${binId}`);
        console.log(`📡 Client subscribed to bin: ${binId}`);
    });
    
    socket.on('unsubscribe', (binId) => {
        socket.leave(`bin_${binId}`);
        console.log(`📴 Client unsubscribed from bin: ${binId}`);
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// ============================================================================
// API Routes
// ============================================================================
app.get('/', (req, res) => {
    res.json({
        message: 'Smart Waste Bin System API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            bins: '/api/bins',
            alerts: '/api/alerts',
            routes: '/api/routes',
            dashboard: '/api/dashboard',
            auth: '/api/auth'
        }
    });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/bins', binRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// ============================================================================
// Error Handling
// ============================================================================
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// ============================================================================
// Start Server
// ============================================================================
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();
    
    server.listen(PORT, () => {
        console.log('\n=================================');
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌐 API URL: http://localhost:${PORT}`);
        console.log('=================================\n');
    });
    
    // Start scheduled tasks
    startScheduledTasks();
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
});

// Start the server
startServer();

module.exports = { app, server, io };
