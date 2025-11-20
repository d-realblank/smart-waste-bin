// ============================================================================
// Bin History Model - Time series data for analytics
// ============================================================================

const mongoose = require('mongoose');

const binHistorySchema = new mongoose.Schema({
    binId: {
        type: String,
        required: true,
        ref: 'Bin',
        index: true
    },
    fillLevel: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    distance: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['NORMAL', 'WARNING', 'FULL', 'ERROR', 'OFFLINE'],
        required: true
    },
    batteryLevel: {
        type: Number,
        min: 0,
        max: 100
    },
    rssi: {
        type: Number
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timeseries: {
        timeField: 'timestamp',
        metaField: 'binId',
        granularity: 'minutes'
    }
});

// Compound index for efficient queries
binHistorySchema.index({ binId: 1, timestamp: -1 });

module.exports = {
    BinHistory: mongoose.model('BinHistory', binHistorySchema)
};
