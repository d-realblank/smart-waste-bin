// ============================================================================
// Route Routes - Collection route management
// ============================================================================

const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { authenticate } = require('../middleware/auth');

// Protect all routes
router.use(authenticate);

router.get('/', routeController.getAllRoutes);
router.get('/today', routeController.getTodaysRoutes);
router.get('/optimize', routeController.optimizeRoute);
router.get('/:id', routeController.getRouteById);
router.post('/', routeController.createRoute);
router.put('/:id', routeController.updateRoute);
router.delete('/:id', routeController.deleteRoute);
router.post('/:id/start', routeController.startRoute);
router.post('/:id/complete-bin', routeController.completeBinInRoute);
router.post('/:id/cancel', routeController.cancelRoute);

module.exports = router;
