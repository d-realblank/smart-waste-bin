// ============================================================================
// Authentication Middleware
// ============================================================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate JWT token
exports.authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token'
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid authentication token'
        });
    }
};

// Authenticate API key (for bin nodes)
exports.authenticateAPIKey = (req, res, next) => {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'No API key provided'
        });
    }
    
    if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Invalid API key'
        });
    }
    
    next();
};

// Check user role
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
        
        next();
    };
};
