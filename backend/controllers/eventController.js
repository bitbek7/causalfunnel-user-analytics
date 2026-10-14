const Event = require('../models/Event');

/**
 * Ingest and store an event (page_view, click, add_to_cart, product_favorite, etc.)
 * POST /api/events
 */
async function createEvent(req, res) {
  try {
    const eventData = req.normalizedEvent;
    const newEvent = await Event.create(eventData);

    return res.status(201).json({
      success: true,
      message: 'Event recorded successfully',
      data: {
        id: newEvent._id,
        sessionId: newEvent.sessionId,
        eventType: newEvent.eventType,
        pageUrl: newEvent.pageUrl,
        pageTitle: newEvent.pageTitle,
        timestamp: newEvent.timestamp,
        ...(newEvent.eventType === 'click' && { x: newEvent.x, y: newEvent.y }),
        ...(newEvent.productId && {
          productId: newEvent.productId,
          productName: newEvent.productName,
          productCategory: newEvent.productCategory
        })
      }
    });
  } catch (err) {
    console.error('[Event Ingestion Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to record event',
      details: err.message
    });
  }
}

module.exports = { createEvent };
