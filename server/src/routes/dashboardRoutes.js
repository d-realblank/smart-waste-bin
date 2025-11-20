// ============================================================================
// Dashboard Routes
// ============================================================================

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/overview', dashboardController.getOverview);
router.get('/stats', dashboardController.getStatistics);
router.get('/bin-status', dashboardController.getBinStatus);
router.get('/alerts-summary', dashboardController.getAlertsSummary);
router.get('/collection-efficiency', dashboardController.getCollectionEfficiency);

module.exports = router;
