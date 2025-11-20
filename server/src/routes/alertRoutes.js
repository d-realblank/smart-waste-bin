// ============================================================================
// Alert Routes
// ============================================================================

const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

router.get('/', alertController.getAllAlerts);
router.get('/active', alertController.getActiveAlerts);
router.get('/:id', alertController.getAlertById);
router.put('/:id/acknowledge', alertController.acknowledgeAlert);
router.put('/:id/resolve', alertController.resolveAlert);
router.delete('/:id', alertController.deleteAlert);

module.exports = router;
