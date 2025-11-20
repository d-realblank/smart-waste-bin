// ============================================================================
// Dashboard Controller - Analytics and statistics
// ============================================================================

const Bin = require('../models/Bin');
const Alert = require('../models/Alert');
const CollectionRoute = require('../models/CollectionRoute');
const { BinHistory } = require('../models/BinHistory');

// @desc    Get dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private
exports.getOverview = async (req, res, next) => {
    try {
        const totalBins = await Bin.countDocuments({ isActive: true });
        const fullBins = await Bin.countDocuments({ status: 'FULL', isActive: true });
        const warningBins = await Bin.countDocuments({ status: 'WARNING', isActive: true });
        const activeAlerts = await Alert.countDocuments({ status: 'ACTIVE' });
        const criticalAlerts = await Alert.countDocuments({ status: 'ACTIVE', priority: 'CRITICAL' });
        const activeroutes = await CollectionRoute.countDocuments({ status: 'IN_PROGRESS' });
        
        // Average fill level
        const bins = await Bin.find({ isActive: true });
        const avgFillLevel = bins.reduce((sum, bin) => sum + bin.fillLevel, 0) / bins.length || 0;
        
        // Bins by status
        const binsByStatus = await Bin.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        res.json({
            success: true,
            data: {
                totalBins,
                fullBins,
                warningBins,
                activeAlerts,
                criticalAlerts,
                activeroutes,
                avgFillLevel: Math.round(avgFillLevel * 10) / 10,
                binsByStatus
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get detailed statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getStatistics = async (req, res, next) => {
    try {
        const { period = '7' } = req.query; // days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        
        // Collection statistics
        const completedRoutes = await CollectionRoute.find({
            status: 'COMPLETED',
            endTime: { $gte: startDate }
        });
        
        const totalCollections = completedRoutes.reduce(
            (sum, route) => sum + route.completedBins.length, 0
        );
        
        const avgCollectionTime = completedRoutes.reduce(
            (sum, route) => sum + (route.actualDuration || 0), 0
        ) / completedRoutes.length || 0;
        
        // Alert statistics
        const totalAlerts = await Alert.countDocuments({
            createdAt: { $gte: startDate }
        });
        
        const resolvedAlerts = await Alert.countDocuments({
            status: 'RESOLVED',
            resolvedAt: { $gte: startDate }
        });
        
        // Fill level trends
        const fillLevelTrends = await BinHistory.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
                    },
                    avgFillLevel: { $avg: '$fillLevel' },
                    maxFillLevel: { $max: '$fillLevel' }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);
        
        res.json({
            success: true,
            data: {
                collections: {
                    total: totalCollections,
                    avgTime: Math.round(avgCollectionTime),
                    completedRoutes: completedRoutes.length
                },
                alerts: {
                    total: totalAlerts,
                    resolved: resolvedAlerts,
                    resolutionRate: totalAlerts > 0 ? Math.round((resolvedAlerts / totalAlerts) * 100) : 0
                },
                trends: fillLevelTrends
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get bin status summary
// @route   GET /api/dashboard/bin-status
// @access  Private
exports.getBinStatus = async (req, res, next) => {
    try {
        const bins = await Bin.find({ isActive: true })
            .select('binId location fillLevel status lastUpdate batteryLevel')
            .sort({ fillLevel: -1 });
        
        const offlineBins = await Bin.getOfflineBins();
        
        res.json({
            success: true,
            data: {
                bins,
                offlineBins: offlineBins.map(b => b.binId)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get alerts summary
// @route   GET /api/dashboard/alerts-summary
// @access  Private
exports.getAlertsSummary = async (req, res, next) => {
    try {
        const activeAlerts = await Alert.find({ status: 'ACTIVE' })
            .sort({ priority: -1, createdAt: -1 })
            .limit(10);
        
        const alertsByType = await Alert.aggregate([
            { $match: { status: 'ACTIVE' } },
            { $group: { _id: '$alertType', count: { $sum: 1 } } }
        ]);
        
        const alertsByPriority = await Alert.aggregate([
            { $match: { status: 'ACTIVE' } },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);
        
        res.json({
            success: true,
            data: {
                recentAlerts: activeAlerts,
                byType: alertsByType,
                byPriority: alertsByPriority
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get collection efficiency metrics
// @route   GET /api/dashboard/collection-efficiency
// @access  Private
exports.getCollectionEfficiency = async (req, res, next) => {
    try {
        const { period = '30' } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        
        const routes = await CollectionRoute.find({
            endTime: { $gte: startDate }
        });
        
        const totalRoutes = routes.length;
        const completedRoutes = routes.filter(r => r.status === 'COMPLETED').length;
        const cancelledRoutes = routes.filter(r => r.status === 'CANCELLED').length;
        
        const avgEfficiency = routes.reduce((sum, route) => {
            if (route.status === 'COMPLETED' && route.actualDuration && route.estimatedDuration) {
                return sum + (route.estimatedDuration / route.actualDuration) * 100;
            }
            return sum;
        }, 0) / completedRoutes || 0;
        
        const totalBinsCollected = routes.reduce(
            (sum, route) => sum + route.completedBins.length, 0
        );
        
        res.json({
            success: true,
            data: {
                totalRoutes,
                completedRoutes,
                cancelledRoutes,
                completionRate: totalRoutes > 0 ? Math.round((completedRoutes / totalRoutes) * 100) : 0,
                avgEfficiency: Math.round(avgEfficiency),
                totalBinsCollected
            }
        });
    } catch (error) {
        next(error);
    }
};
