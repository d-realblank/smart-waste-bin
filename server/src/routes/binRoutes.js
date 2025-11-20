// ============================================================================
// Bin Routes - API endpoints for bin operations
// ============================================================================

const express = require('express');
const router = express.Router();
const binController = require('../controllers/binController');
const { authenticateAPIKey } = require('../middleware/auth');

// Public routes (for bin nodes with API key)
router.post('/status', authenticateAPIKey, binController.updateBinStatus);
router.post('/alert', authenticateAPIKey, binController.createAlert);

// Protected routes (for dashboard)
router.get('/', binController.getAllBins);
router.get('/:binId', binController.getBinById);
router.post('/', binController.createBin);
router.put('/:binId', binController.updateBin);
router.delete('/:binId', binController.deleteBin);
router.post('/:binId/empty', binController.markBinEmptied);
router.get('/:binId/history', binController.getBinHistory);

module.exports = router;
