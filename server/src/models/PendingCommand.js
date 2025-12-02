const mongoose = require('mongoose');

const pendingCommandSchema = new mongoose.Schema({
    binId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['SET_INTERVAL', 'REBOOT', 'SET_THRESHOLD', 'HEIGHT', 'INTERVAL'],
        required: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    status: {
        type: String,
        enum: ['PENDING', 'SENT', 'EXECUTED'],
        default: 'PENDING'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Auto-delete after 24 hours if not picked up
    }
});

module.exports = mongoose.model('PendingCommand', pendingCommandSchema);
