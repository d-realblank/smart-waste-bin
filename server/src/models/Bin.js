// ============================================================================
// Bin Model - Database Schema
// ============================================================================

const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
    binId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    coordinates: {
        latitude: {
            type: Number,
            required: false
        },
        longitude: {
            type: Number,
            required: false
        }
    },
    fillLevel: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0
    },
    distance: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ['NORMAL', 'WARNING', 'FULL', 'ERROR', 'OFFLINE'],
        default: 'NORMAL'
    },
    isFull: {
        type: Boolean,
        default: false
    },
    batteryLevel: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
    },
    rssi: {
        type: Number,
        default: 0
    },
    lastUpdate: {
        type: Date,
        default: Date.now
    },
    lastEmptied: {
        type: Date,
        default: null
    },
    capacity: {
        type: Number,
        default: 100 // in liters
    },
    binHeight: {
        type: Number,
        default: 100 // in centimeters
    },
    reportInterval: {
        type: Number,
        default: 30000 // in milliseconds
    },
    warningThreshold: {
        type: Number,
        default: 70
    },
    fullThreshold: {
        type: Number,
        default: 85
    },
    isActive: {
        type: Boolean,
        default: true
    },
    metadata: {
        firmwareVersion: String,
        hardwareRevision: String,
        installDate: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
binSchema.index({ status: 1 });
binSchema.index({ lastUpdate: -1 });
binSchema.index({ fillLevel: -1 });
binSchema.index({ location: 1 });

// Virtual for checking if bin needs attention
binSchema.virtual('needsAttention').get(function() {
    return this.fillLevel >= 70 || this.status === 'ERROR';
});

// Method to check if bin is offline
binSchema.methods.isOffline = function() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastUpdate < fiveMinutesAgo;
};

// Method to update bin status
binSchema.methods.updateStatus = function(data) {
    this.fillLevel = data.fillLevel || this.fillLevel;
    this.distance = data.distance || this.distance;
    this.batteryLevel = data.batteryLevel || this.batteryLevel;
    this.rssi = data.rssi || this.rssi;
    if (data.location) {
        this.location = data.location;
    }
    if (data.binHeight) {
        this.binHeight = data.binHeight;
    }
    if (data.reportInterval) {
        this.reportInterval = data.reportInterval;
    }
    if (data.warningThreshold) {
        this.warningThreshold = data.warningThreshold;
    }
    if (data.fullThreshold) {
        this.fullThreshold = data.fullThreshold;
    }
    this.lastUpdate = new Date();
    
    // Auto-determine status
    if (data.status) {
        this.status = data.status;
    } else if (this.fillLevel >= (this.fullThreshold || 85)) {
        this.status = 'FULL';
        this.isFull = true;
    } else if (this.fillLevel >= (this.warningThreshold || 70)) {
        this.status = 'WARNING';
        this.isFull = false;
    } else {
        this.status = 'NORMAL';
        this.isFull = false;
    }
    
    return this.save();
};

// Static method to get bins needing collection
binSchema.statics.getNeedingCollection = function() {
    return this.find({
        isActive: true,
        $or: [
            { status: 'FULL' },
            { status: 'WARNING', fillLevel: { $gte: 75 } }
        ]
    }).sort({ fillLevel: -1 });
};

// Static method to get offline bins
binSchema.statics.getOfflineBins = function() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.find({
        isActive: true,
        lastUpdate: { $lt: fiveMinutesAgo }
    });
};

module.exports = mongoose.model('Bin', binSchema);
