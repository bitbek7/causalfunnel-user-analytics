/**
 * Normalization and validation middleware for incoming telemetry events
 */
function validateEventPayload(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Invalid payload: Request body must be a JSON object.'
    });
  }

  // Normalize snake_case or camelCase field names
  const sessionId = body.sessionId || body.session_id;
  const eventType = body.eventType || body.event_type;
  const pageUrl = body.pageUrl || body.page_url;
  const timestamp = body.timestamp || new Date().toISOString();

  const errors = [];

  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    errors.push('sessionId is required and must be a non-empty string.');
  }

  if (!eventType || (eventType !== 'page_view' && eventType !== 'click')) {
    errors.push('eventType is required and must be either "page_view" or "click".');
  }

  if (!pageUrl || typeof pageUrl !== 'string' || !pageUrl.trim()) {
    errors.push('pageUrl is required and must be a non-empty string.');
  }

  if (eventType === 'click') {
    if (body.x === undefined || body.x === null || typeof body.x !== 'number' || isNaN(body.x) || body.x < 0) {
      errors.push('x coordinate is required for click events and must be a non-negative number.');
    }
    if (body.y === undefined || body.y === null || typeof body.y !== 'number' || isNaN(body.y) || body.y < 0) {
      errors.push('y coordinate is required for click events and must be a non-negative number.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  // Attach normalized payload to request object
  req.normalizedEvent = {
    sessionId: sessionId.trim(),
    eventType: eventType.trim(),
    pageUrl: pageUrl.trim(),
    timestamp: new Date(timestamp),
    x: eventType === 'click' ? Math.round(body.x) : undefined,
    y: eventType === 'click' ? Math.round(body.y) : undefined,
    viewport: body.viewport && typeof body.viewport === 'object' ? {
      width: Number(body.viewport.width) || undefined,
      height: Number(body.viewport.height) || undefined
    } : undefined,
    elementTag: body.elementTag ? String(body.elementTag).slice(0, 50) : undefined,
    elementText: body.elementText ? String(body.elementText).slice(0, 120) : undefined,
    receivedAt: new Date()
  };

  next();
}

module.exports = { validateEventPayload };
