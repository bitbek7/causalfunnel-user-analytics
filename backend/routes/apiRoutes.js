const express = require('express');
const router = express.Router();

const { validateEventPayload } = require('../middleware/validator');
const { createEvent } = require('../controllers/eventController');
const { getSessions, getSessionEvents } = require('../controllers/sessionController');
const { getHeatmapData, getTrackedPages, seedDemoData } = require('../controllers/heatmapController');

// 1. Ingest event
router.post('/events', validateEventPayload, createEvent);

// 2. Fetch list of sessions with event counts
router.get('/sessions', getSessions);

// 3. Fetch chronological events for a specific session
router.get('/sessions/:sessionId/events', getSessionEvents);

// 4. Fetch click coordinates for heatmap
router.get('/heatmap', getHeatmapData);

// 5. Tracked page URLs helper
router.get('/pages', getTrackedPages);

// 6. Reviewer demo seed helper
router.post('/seed', seedDemoData);

module.exports = router;
