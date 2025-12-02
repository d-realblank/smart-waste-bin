// ============================================================================
// Alert Model - Database Schema
// ============================================================================

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    binId: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    alertType: {
        type: String,
        enum: ['BIN_FULL', 'LOW_BATTERY', 'SENSOR_ERROR', 'OFFLINE', 'MAINTENANCE_REQUIRED'],
        required: true
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'],
        default: 'ACTIVE'
    },
    fillLevel: {
        type: Number,
        min: 0,
        max: 100
    },
    acknowledgedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    acknowledgedAt: {
        type: Date,
        default: null
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    resolvedAt: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Indexes
alertSchema.index({ status: 1, createdAt: -1 });
alertSchema.index({ binId: 1, status: 1 });
alertSchema.index({ priority: 1, status: 1 });

// Method to acknowledge alert
alertSchema.methods.acknowledge = function(userId) {
    this.status = 'ACKNOWLEDGED';
    this.acknowledgedBy = userId;
    this.acknowledgedAt = new Date();
    return this.save();
};

// Method to resolve alert
alertSchema.methods.resolve = function(userId, notes) {
    this.status = 'RESOLVED';
    this.resolvedBy = userId;
    this.resolvedAt = new Date();
    if (notes) {
        this.notes = notes;
    }
    return this.save();
};

// Static method to get active alerts
alertSchema.statics.getActiveAlerts = function() {
    return this.find({ status: 'ACTIVE' })
        .sort({ priority: -1, createdAt: -1 });
};

// Static method to get critical alerts
alertSchema.statics.getCriticalAlerts = function() {
    return this.find({ 
        status: 'ACTIVE',
        priority: 'CRITICAL'
    }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Alert', alertSchema);
