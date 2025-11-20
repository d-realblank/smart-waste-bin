// ============================================================================
// Route Controller - Collection route optimization
// ============================================================================

const CollectionRoute = require('../models/CollectionRoute');
const Bin = require('../models/Bin');

// @desc    Get all routes
// @route   GET /api/routes
// @access  Private
exports.getAllRoutes = async (req, res, next) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        
        const routes = await CollectionRoute.find(filter)
            .populate('bins.binId')
            .populate('assignedTo', 'username firstName lastName')
            .sort({ scheduledDate: -1 });
        
        res.json({
            success: true,
            count: routes.length,
            data: routes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get today's routes
// @route   GET /api/routes/today
// @access  Private
exports.getTodaysRoutes = async (req, res, next) => {
    try {
        const routes = await CollectionRoute.getTodaysRoutes();
        
        res.json({
            success: true,
            count: routes.length,
            data: routes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get route by ID
// @route   GET /api/routes/:id
// @access  Private
exports.getRouteById = async (req, res, next) => {
    try {
        const route = await CollectionRoute.findById(req.params.id)
            .populate('bins.binId')
            .populate('assignedTo', 'username firstName lastName');
        
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }
        
        res.json({
            success: true,
            data: route
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new route
// @route   POST /api/routes
// @access  Private
exports.createRoute = async (req, res, next) => {
    try {
        const route = await CollectionRoute.create(req.body);
        
        res.status(201).json({
            success: true,
            data: route
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Optimize collection route
// @route   GET /api/routes/optimize
// @access  Private
exports.optimizeRoute = async (req, res, next) => {
    try {
        // Get bins that need collection
        const binsNeedingCollection = await Bin.getNeedingCollection();
        
        if (binsNeedingCollection.length === 0) {
            return res.json({
                success: true,
                message: 'No bins need collection at this time',
                data: { bins: [], estimatedDuration: 0, totalDistance: 0 }
            });
        }
        
        // Sort by priority (fill level)
        const sortedBins = binsNeedingCollection.sort((a, b) => b.fillLevel - a.fillLevel);
        
        // Create optimized route
        const optimizedBins = sortedBins.map((bin, index) => ({
            binId: bin.binId,
            order: index + 1,
            estimatedTime: 5, // 5 minutes per bin
            fillLevel: bin.fillLevel,
            location: bin.location,
            coordinates: bin.coordinates
        }));
        
        // Calculate metrics
        const estimatedDuration = optimizedBins.length * 5; // 5 min per bin
        const totalDistance = calculateTotalDistance(optimizedBins);
        
        res.json({
            success: true,
            data: {
                bins: optimizedBins,
                estimatedDuration,
                totalDistance,
                count: optimizedBins.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private
exports.updateRoute = async (req, res, next) => {
    try {
        const route = await CollectionRoute.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }
        
        res.json({
            success: true,
            data: route
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Start route
// @route   POST /api/routes/:id/start
// @access  Private
exports.startRoute = async (req, res, next) => {
    try {
        const route = await CollectionRoute.findById(req.params.id);
        
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }
        
        await route.start(req.user._id);
        
        // Emit real-time update
        const io = req.app.get('io');
        io.emit('routeStarted', route);
        
        res.json({
            success: true,
            message: 'Route started',
            data: route
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Complete bin in route
// @route   POST /api/routes/:id/complete-bin
// @access  Private
exports.completeBinInRoute = async (req, res, next) => {
    try {
        const { binId, fillLevel, notes } = req.body;
        
        const route = await CollectionRoute.findById(req.params.id);
        
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }
        
        await route.completeBin(binId, fillLevel, notes);
        
        // Update bin status
        const bin = await Bin.findOne({ binId });
        if (bin) {
            bin.fillLevel = 0;
            bin.status = 'NORMAL';
            bin.isFull = false;
            bin.lastEmptied = new Date();
            await bin.save();
        }
        
        // Emit real-time update
        const io = req.app.get('io');
        io.emit('binCompleted', { route, binId });
        
        res.json({
            success: true,
            message: 'Bin marked as completed',
            data: route
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel route
// @route   POST /api/routes/:id/cancel
// @access  Private
exports.cancelRoute = async (req, res, next) => {
    try {
        const route = await CollectionRoute.findById(req.params.id);
        
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }
        
        await route.cancel(req.body.reason);
        
        res.json({
            success: true,
            message: 'Route cancelled',
            data: route
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete route
// @route   DELETE /api/routes/:id
// @access  Private
exports.deleteRoute = async (req, res, next) => {
    try {
        const route = await CollectionRoute.findByIdAndDelete(req.params.id);
        
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Route deleted'
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to calculate total distance
function calculateTotalDistance(bins) {
    if (bins.length < 2) return 0;
    
    let totalDistance = 0;
    
    for (let i = 0; i < bins.length - 1; i++) {
        const bin1 = bins[i];
        const bin2 = bins[i + 1];
        
        if (bin1.coordinates && bin2.coordinates) {
            // Haversine formula for distance between coordinates
            const R = 6371e3; // Earth radius in meters
            const φ1 = bin1.coordinates.latitude * Math.PI / 180;
            const φ2 = bin2.coordinates.latitude * Math.PI / 180;
            const Δφ = (bin2.coordinates.latitude - bin1.coordinates.latitude) * Math.PI / 180;
            const Δλ = (bin2.coordinates.longitude - bin1.coordinates.longitude) * Math.PI / 180;
            
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            
            totalDistance += R * c;
        } else {
            // Estimate if coordinates not available
            totalDistance += 100; // 100 meters per bin
        }
    }
    
    return Math.round(totalDistance);
}
