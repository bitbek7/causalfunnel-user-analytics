/**
 * Normalization and validation middleware for incoming telemetry events
 */
const VALID_EVENT_TYPES = [
  'page_view',
  'click',
  'add_to_cart',
  'product_favorite',
  'product_unfavorite',
  'product_view'
];

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
  const pageTitle = body.pageTitle || body.page_title;
  const timestamp = body.timestamp || new Date().toISOString();

  const productId = body.productId || body.product_id;
  const productName = body.productName || body.product_name;
  const productCategory = body.productCategory || body.product_category;
  const source = body.source || 'demo_store';

  const errors = [];

  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    errors.push('sessionId is required and must be a non-empty string.');
  }

  if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
    errors.push(`eventType is required and must be one of: ${VALID_EVENT_TYPES.join(', ')}.`);
  }

  if (!pageUrl || typeof pageUrl !== 'string' || !pageUrl.trim()) {
    errors.push('pageUrl is required and must be a non-empty string.');
  }

  // Coordinates are strictly validated for click events
  if (eventType === 'click') {
    if (body.x === undefined || body.x === null || typeof body.x !== 'number' || isNaN(body.x) || body.x < 0) {
      errors.push('x coordinate is required for click events and must be a non-negative number.');
    }
    if (body.y === undefined || body.y === null || typeof body.y !== 'number' || isNaN(body.y) || body.y < 0) {
      errors.push('y coordinate is required for click events and must be a non-negative number.');
    }
  }

  // Product ID is validated for product-specific events
  if (['add_to_cart', 'product_favorite', 'product_unfavorite'].includes(eventType)) {
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      errors.push(`productId is required for ${eventType} events.`);
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
    pageTitle: pageTitle ? String(pageTitle).trim().slice(0, 200) : undefined,
    timestamp: new Date(timestamp),
    x: eventType === 'click' ? Math.round(body.x) : (body.x !== undefined && typeof body.x === 'number' ? Math.round(body.x) : undefined),
    y: eventType === 'click' ? Math.round(body.y) : (body.y !== undefined && typeof body.y === 'number' ? Math.round(body.y) : undefined),
    productId: productId ? String(productId).trim() : undefined,
    productName: productName ? String(productName).trim().slice(0, 150) : undefined,
    productCategory: productCategory ? String(productCategory).trim().slice(0, 100) : undefined,
    source: String(source).trim(),
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
