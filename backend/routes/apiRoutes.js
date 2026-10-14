const express = require('express');
const router = express.Router();

const { validateEventPayload } = require('../middleware/validator');
const { createEvent } = require('../controllers/eventController');
const { getSessions, getSessionEvents } = require('../controllers/sessionController');
const { getHeatmapData, getTrackedPages } = require('../controllers/heatmapController');
const { getProductRankings } = require('../controllers/productController');

// 1. Ingest telemetry event
router.post('/events', validateEventPayload, createEvent);

// 2. Fetch list of sessions with event counts & summaries
router.get('/sessions', getSessions);

// 3. Fetch chronological events for a specific session
router.get('/sessions/:sessionId/events', getSessionEvents);

// 4. Fetch click coordinates for heatmap visualization
router.get('/heatmap', getHeatmapData);

// 5. Tracked page URLs helper
router.get('/pages', getTrackedPages);

// 6. Product interaction rankings (clicks, cart additions, favorites)
router.get('/products/rankings', getProductRankings);

module.exports = router;
