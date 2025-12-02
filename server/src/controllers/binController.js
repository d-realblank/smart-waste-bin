// ============================================================================
// Bin Controller - Business logic for bin operations
// ============================================================================

const Bin = require('../models/Bin');
const Alert = require('../models/Alert');
const { BinHistory } = require('../models/BinHistory');
const PendingCommand = require('../models/PendingCommand');

// @desc    Get all bins
// @route   GET /api/bins
// @access  Private
exports.getAllBins = async (req, res, next) => {
    try {
        const { status, location, isActive } = req.query;
        
        const filter = {};
        if (status) filter.status = status;
        if (location) filter.location = new RegExp(location, 'i');
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        
        const bins = await Bin.find(filter).sort({ lastUpdate: -1 });
        
        res.json({
            success: true,
            count: bins.length,
            data: bins
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get bin by ID
// @route   GET /api/bins/:binId
// @access  Private
exports.getBinById = async (req, res, next) => {
    try {
        const bin = await Bin.findOne({ binId: req.params.binId });
        
        if (!bin) {
            return res.status(404).json({
                success: false,
                message: 'Bin not found'
            });
        }
        
        res.json({
            success: true,
            data: bin
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new bin
// @route   POST /api/bins
// @access  Private
exports.createBin = async (req, res, next) => {
    try {
        const bin = await Bin.create(req.body);
        
        res.status(201).json({
            success: true,
            data: bin
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Bin ID already exists'
            });
        }
        next(error);
    }
};

// @desc    Update bin status (from bin node)
// @route   POST /api/bins/status
// @access  API Key
exports.updateBinStatus = async (req, res, next) => {
    try {
        const { binId, fillLevel, distance, status, batteryLevel, rssi, location, binHeight, reportInterval } = req.body;
        
        let bin = await Bin.findOne({ binId });
        
        // Create bin if it doesn't exist
        if (!bin) {
            bin = await Bin.create({
                binId,
                location: location || 'Unknown',
                fillLevel,
                distance,
                status,
                batteryLevel,
                rssi,
                binHeight: binHeight || 100,
                reportInterval: reportInterval || 30000
            });
        } else {
            // Update existing bin
            const updateData = {
                fillLevel,
                distance,
                status,
                batteryLevel,
                rssi,
                binHeight,
                reportInterval
            };
            
            // Update location if provided
            if (location) {
                updateData.location = location;
            }
            
            await bin.updateStatus(updateData);
        }
        
        // Save to history
        await BinHistory.create({
            binId,
            fillLevel,
            distance,
            status,
            batteryLevel,
            rssi
        });
        
        // Emit real-time update via WebSocket
        const io = req.app.get('io');
        io.emit('binUpdate', bin);
        io.to(`bin_${binId}`).emit('binStatusUpdate', bin);
        
        // Check for low battery
        if (batteryLevel < 20 && batteryLevel > 0) {
            const existingAlert = await Alert.findOne({
                binId,
                alertType: 'LOW_BATTERY',
                status: 'ACTIVE'
            });
            
            if (!existingAlert) {
                const alert = await Alert.create({
                    binId,
                    alertType: 'LOW_BATTERY',
                    priority: 'MEDIUM',
                    message: `Battery level low: ${batteryLevel}%`,
                    fillLevel
                });
                
                io.emit('newAlert', alert);
            }
        }

        // Check for full bin alert (Added for relayed data)
        if (status === 'FULL' || fillLevel >= 85) {
             const existingAlert = await Alert.findOne({
                binId,
                alertType: 'BIN_FULL',
                status: 'ACTIVE'
            });
            
            if (!existingAlert) {
                console.log(`[BinController] Creating new alert for bin ${binId} (Level: ${fillLevel}%)`);
                const alert = await Alert.create({
                    binId,
                    alertType: 'BIN_FULL',
                    priority: 'HIGH',
                    message: 'Bin has reached full capacity',
                    fillLevel
                });
                console.log('[BinController] Alert created:', alert);
                
                io.emit('newAlert', alert);
            } else {
                console.log(`[BinController] Alert already exists for bin ${binId}`);
            }
        }
        
        // Check for pending commands
        const pendingCommand = await PendingCommand.findOne({ 
            binId, 
            status: 'PENDING' 
        }).sort({ createdAt: 1 });

        const responseData = {
            success: true,
            message: 'Status updated successfully',
            data: bin
        };

        if (pendingCommand) {
            responseData.command = {
                id: pendingCommand._id,
                type: pendingCommand.type,
                value: pendingCommand.value,
                target: binId
            };
            
            // Mark as sent
            pendingCommand.status = 'SENT';
            await pendingCommand.save();
            
            // Optimistically update bin config in DB
            if (pendingCommand.type === 'HEIGHT') {
                bin.binHeight = parseInt(pendingCommand.value);
                await bin.save();
            } else if (pendingCommand.type === 'INTERVAL') {
                bin.reportInterval = parseInt(pendingCommand.value);
                await bin.save();
            }
            
            console.log(`[BinController] Sent command ${pendingCommand.type} to ${binId}`);
        }
        
        res.json(responseData);
    } catch (error) {
        next(error);
    }
};

// @desc    Queue a command for a bin
// @route   POST /api/bins/:binId/command
// @access  Private
exports.queueCommand = async (req, res, next) => {
    try {
        const { type, value } = req.body;
        const { binId } = req.params;
        
        if (!['SET_INTERVAL', 'REBOOT', 'SET_THRESHOLD', 'HEIGHT', 'INTERVAL'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid command type'
            });
        }
        
        const command = await PendingCommand.create({
            binId,
            type,
            value
        });
        
        res.status(201).json({
            success: true,
            message: 'Command queued successfully',
            data: command
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create alert (from bin node)
// @route   POST /api/bins/alert
// @access  API Key
exports.createAlert = async (req, res, next) => {
    try {
        const { binId, alertType, message, priority, fillLevel } = req.body;
        
        // Check for duplicate active alerts
        const existingAlert = await Alert.findOne({
            binId,
            alertType,
            status: 'ACTIVE'
        });
        
        if (existingAlert) {
            return res.json({
                success: true,
                message: 'Alert already exists',
                data: existingAlert
            });
        }
        
        const alert = await Alert.create({
            binId,
            alertType,
            message,
            priority,
            fillLevel
        });
        
        // Emit real-time alert via WebSocket
        const io = req.app.get('io');
        io.emit('newAlert', alert);
        
        res.status(201).json({
            success: true,
            message: 'Alert created successfully',
            data: alert
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update bin
// @route   PUT /api/bins/:binId
// @access  Private
exports.updateBin = async (req, res, next) => {
    try {
        const bin = await Bin.findOneAndUpdate(
            { binId: req.params.binId },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!bin) {
            return res.status(404).json({
                success: false,
                message: 'Bin not found'
            });
        }
        
        res.json({
            success: true,
            data: bin
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete bin
// @route   DELETE /api/bins/:binId
// @access  Private
exports.deleteBin = async (req, res, next) => {
    try {
        const bin = await Bin.findOneAndDelete({ binId: req.params.binId });
        
        if (!bin) {
            return res.status(404).json({
                success: false,
                message: 'Bin not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Bin deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark bin as emptied
// @route   POST /api/bins/:binId/empty
// @access  Private
exports.markBinEmptied = async (req, res, next) => {
    try {
        const bin = await Bin.findOne({ binId: req.params.binId });
        
        if (!bin) {
            return res.status(404).json({
                success: false,
                message: 'Bin not found'
            });
        }
        
        bin.fillLevel = 0;
        bin.status = 'NORMAL';
        bin.isFull = false;
        bin.lastEmptied = new Date();
        await bin.save();
        
        // Resolve related alerts
        await Alert.updateMany(
            { binId: bin.binId, status: 'ACTIVE' },
            { 
                status: 'RESOLVED',
                resolvedAt: new Date(),
                notes: 'Bin emptied'
            }
        );
        
        // Emit real-time update
        const io = req.app.get('io');
        io.emit('binEmptied', bin);
        
        res.json({
            success: true,
            message: 'Bin marked as emptied',
            data: bin
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get bin history
// @route   GET /api/bins/:binId/history
// @access  Private
exports.getBinHistory = async (req, res, next) => {
    try {
        const { days = 7 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        
        const history = await BinHistory.find({
            binId: req.params.binId,
            timestamp: { $gte: startDate }
        }).sort({ timestamp: 1 });
        
        res.json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error) {
        next(error);
    }
};
