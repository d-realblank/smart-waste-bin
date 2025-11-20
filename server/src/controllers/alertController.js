// ============================================================================
// Alert Controller
// ============================================================================

const Alert = require('../models/Alert');
const Bin = require('../models/Bin');

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private
exports.getAllAlerts = async (req, res, next) => {
    try {
        const { status, priority, binId } = req.query;
        
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (binId) filter.binId = binId;
        
        const alerts = await Alert.find(filter)
            .sort({ createdAt: -1 })
            .populate('acknowledgedBy', 'username firstName lastName')
            .populate('resolvedBy', 'username firstName lastName');
        
        res.json({
            success: true,
            count: alerts.length,
            data: alerts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get active alerts
// @route   GET /api/alerts/active
// @access  Private
exports.getActiveAlerts = async (req, res, next) => {
    try {
        const alerts = await Alert.getActiveAlerts();
        
        res.json({
            success: true,
            count: alerts.length,
            data: alerts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get alert by ID
// @route   GET /api/alerts/:id
// @access  Private
exports.getAlertById = async (req, res, next) => {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate('acknowledgedBy', 'username firstName lastName')
            .populate('resolvedBy', 'username firstName lastName');
        
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }
        
        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Acknowledge alert
// @route   PUT /api/alerts/:id/acknowledge
// @access  Private
exports.acknowledgeAlert = async (req, res, next) => {
    try {
        const alert = await Alert.findById(req.params.id);
        
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }
        
        await alert.acknowledge(req.user._id);
        
        // Emit real-time update
        const io = req.app.get('io');
        io.emit('alertAcknowledged', alert);
        
        res.json({
            success: true,
            message: 'Alert acknowledged',
            data: alert
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Resolve alert
// @route   PUT /api/alerts/:id/resolve
// @access  Private
exports.resolveAlert = async (req, res, next) => {
    try {
        const alert = await Alert.findById(req.params.id);
        
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }
        
        await alert.resolve(req.user._id, req.body.notes);
        
        // Emit real-time update
        const io = req.app.get('io');
        io.emit('alertResolved', alert);
        
        res.json({
            success: true,
            message: 'Alert resolved',
            data: alert
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete alert
// @route   DELETE /api/alerts/:id
// @access  Private
exports.deleteAlert = async (req, res, next) => {
    try {
        const alert = await Alert.findByIdAndDelete(req.params.id);
        
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Alert deleted'
        });
    } catch (error) {
        next(error);
    }
};
