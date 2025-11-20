// ============================================================================
// Collection Route Model - Database Schema
// ============================================================================

const mongoose = require('mongoose');

const collectionRouteSchema = new mongoose.Schema({
    routeName: {
        type: String,
        required: true,
        trim: true
    },
    bins: [{
        binId: {
            type: String,
            ref: 'Bin',
            required: true
        },
        order: {
            type: Number,
            required: true
        },
        estimatedTime: {
            type: Number, // in minutes
            default: 5
        }
    }],
    status: {
        type: String,
        enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'PLANNED'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: Date,
        default: null
    },
    endTime: {
        type: Date,
        default: null
    },
    totalDistance: {
        type: Number, // in meters
        default: 0
    },
    estimatedDuration: {
        type: Number, // in minutes
        default: 0
    },
    actualDuration: {
        type: Number, // in minutes
        default: null
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'MEDIUM'
    },
    notes: {
        type: String,
        default: ''
    },
    completedBins: [{
        binId: String,
        completedAt: Date,
        fillLevelBefore: Number,
        notes: String
    }]
}, {
    timestamps: true
});

// Indexes
collectionRouteSchema.index({ status: 1, scheduledDate: 1 });
collectionRouteSchema.index({ assignedTo: 1, status: 1 });

// Method to start route
collectionRouteSchema.methods.start = function(userId) {
    this.status = 'IN_PROGRESS';
    this.assignedTo = userId;
    this.startTime = new Date();
    return this.save();
};

// Method to complete bin in route
collectionRouteSchema.methods.completeBin = function(binId, fillLevel, notes) {
    this.completedBins.push({
        binId,
        completedAt: new Date(),
        fillLevelBefore: fillLevel,
        notes: notes || ''
    });
    
    // Check if all bins are completed
    if (this.completedBins.length === this.bins.length) {
        this.status = 'COMPLETED';
        this.endTime = new Date();
        this.actualDuration = Math.round((this.endTime - this.startTime) / 60000); // in minutes
    }
    
    return this.save();
};

// Method to cancel route
collectionRouteSchema.methods.cancel = function(reason) {
    this.status = 'CANCELLED';
    this.notes = reason || 'Route cancelled';
    return this.save();
};

// Static method to get today's routes
collectionRouteSchema.statics.getTodaysRoutes = function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.find({
        scheduledDate: {
            $gte: today,
            $lt: tomorrow
        }
    }).populate('bins.binId').populate('assignedTo');
};

// Static method to get active routes
collectionRouteSchema.statics.getActiveRoutes = function() {
    return this.find({
        status: 'IN_PROGRESS'
    }).populate('bins.binId').populate('assignedTo');
};

module.exports = mongoose.model('CollectionRoute', collectionRouteSchema);
