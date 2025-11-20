// ============================================================================
// Scheduler Service - Background tasks and automation
// ============================================================================

const cron = require('node-cron');
const Bin = require('../models/Bin');
const Alert = require('../models/Alert');
const CollectionRoute = require('../models/CollectionRoute');

// Check for offline bins every 5 minutes
const checkOfflineBins = cron.schedule('*/5 * * * *', async () => {
    try {
        console.log('🔍 Checking for offline bins...');
        
        const offlineBins = await Bin.getOfflineBins();
        
        for (const bin of offlineBins) {
            // Create alert if not already exists
            const existingAlert = await Alert.findOne({
                binId: bin.binId,
                alertType: 'OFFLINE',
                status: 'ACTIVE'
            });
            
            if (!existingAlert && bin.status !== 'OFFLINE') {
                await Alert.create({
                    binId: bin.binId,
                    alertType: 'OFFLINE',
                    priority: 'HIGH',
                    message: `Bin ${bin.binId} has not reported in over 5 minutes`,
                    fillLevel: bin.fillLevel
                });
                
                // Update bin status
                bin.status = 'OFFLINE';
                await bin.save();
                
                console.log(`⚠️  Created offline alert for bin: ${bin.binId}`);
            }
        }
        
        console.log(`✅ Offline check complete - ${offlineBins.length} offline bins found`);
    } catch (error) {
        console.error('❌ Error checking offline bins:', error);
    }
}, {
    scheduled: false
});

// Generate collection routes daily at 6 AM
const generateDailyRoutes = cron.schedule('0 6 * * *', async () => {
    try {
        console.log('📋 Generating daily collection routes...');
        
        const binsNeedingCollection = await Bin.getNeedingCollection();
        
        if (binsNeedingCollection.length === 0) {
            console.log('✅ No bins need collection today');
            return;
        }
        
        // Group bins by priority
        const highPriorityBins = binsNeedingCollection.filter(b => b.fillLevel >= 85);
        const mediumPriorityBins = binsNeedingCollection.filter(b => b.fillLevel >= 70 && b.fillLevel < 85);
        
        // Create high priority route if needed
        if (highPriorityBins.length > 0) {
            const route = await CollectionRoute.create({
                routeName: `High Priority Route - ${new Date().toLocaleDateString()}`,
                bins: highPriorityBins.map((bin, index) => ({
                    binId: bin.binId,
                    order: index + 1,
                    estimatedTime: 5
                })),
                scheduledDate: new Date(),
                priority: 'HIGH',
                estimatedDuration: highPriorityBins.length * 5
            });
            
            console.log(`✅ Created high priority route with ${highPriorityBins.length} bins`);
        }
        
        // Create medium priority route if needed
        if (mediumPriorityBins.length > 0) {
            const route = await CollectionRoute.create({
                routeName: `Standard Route - ${new Date().toLocaleDateString()}`,
                bins: mediumPriorityBins.map((bin, index) => ({
                    binId: bin.binId,
                    order: index + 1,
                    estimatedTime: 5
                })),
                scheduledDate: new Date(),
                priority: 'MEDIUM',
                estimatedDuration: mediumPriorityBins.length * 5
            });
            
            console.log(`✅ Created standard route with ${mediumPriorityBins.length} bins`);
        }
        
        console.log('✅ Daily route generation complete');
    } catch (error) {
        console.error('❌ Error generating daily routes:', error);
    }
}, {
    scheduled: false
});

// Clean up old alerts and history every day at 2 AM
const cleanupOldData = cron.schedule('0 2 * * *', async () => {
    try {
        console.log('🧹 Cleaning up old data...');
        
        // Delete resolved alerts older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const deletedAlerts = await Alert.deleteMany({
            status: 'RESOLVED',
            resolvedAt: { $lt: thirtyDaysAgo }
        });
        
        console.log(`✅ Deleted ${deletedAlerts.deletedCount} old alerts`);
        
        // Note: Consider archiving bin history instead of deleting
        // Or implement a data retention policy based on requirements
        
        console.log('✅ Cleanup complete');
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
}, {
    scheduled: false
});

// Export function to start all scheduled tasks
exports.startScheduledTasks = () => {
    console.log('⏰ Starting scheduled tasks...');
    
    checkOfflineBins.start();
    console.log('✅ Offline bin check task started (every 5 minutes)');
    
    generateDailyRoutes.start();
    console.log('✅ Daily route generation task started (6 AM daily)');
    
    cleanupOldData.start();
    console.log('✅ Data cleanup task started (2 AM daily)');
};

// Export individual tasks for testing
exports.tasks = {
    checkOfflineBins,
    generateDailyRoutes,
    cleanupOldData
};
