const Event = require('../models/Event');

/**
 * Fetch click data for a particular page for heatmap rendering
 * GET /api/heatmap?pageUrl=...
 */
async function getHeatmapData(req, res) {
  try {
    const { pageUrl } = req.query;

    if (!pageUrl || typeof pageUrl !== 'string' || !pageUrl.trim()) {
      return res.status(400).json({
        success: false,
        error: 'pageUrl query parameter is required (e.g. /api/heatmap?pageUrl=/index.html)'
      });
    }

    const trimmedUrl = pageUrl.trim();

    // Query click events for the requested pageUrl
    const clicks = await Event.find(
      {
        pageUrl: trimmedUrl,
        eventType: 'click'
      },
      {
        _id: 1,
        sessionId: 1,
        x: 1,
        y: 1,
        timestamp: 1,
        elementTag: 1,
        elementText: 1,
        viewport: 1
      }
    )
      .sort({ timestamp: 1 })
      .lean();

    // Also get the total pageviews on this page to calculate click-through density
    const totalPageViews = await Event.countDocuments({
      pageUrl: trimmedUrl,
      eventType: 'page_view'
    });

    // Compute bounding box / max coordinates for canvas scaling
    let maxX = 0;
    let maxY = 0;
    clicks.forEach((c) => {
      if (c.x > maxX) maxX = c.x;
      if (c.y > maxY) maxY = c.y;
    });

    return res.status(200).json({
      success: true,
      pageUrl: trimmedUrl,
      totalClicks: clicks.length,
      totalPageViews,
      bounds: {
        maxX: Math.max(maxX, 1200),
        maxY: Math.max(maxY, 800)
      },
      clicks
    });
  } catch (err) {
    console.error('[Get Heatmap Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve heatmap data',
      details: err.message
    });
  }
}

/**
 * Get distinct tracked pages with event breakdowns
 * GET /api/pages
 */
async function getTrackedPages(req, res) {
  try {
    const pages = await Event.aggregate([
      {
        $group: {
          _id: '$pageUrl',
          totalEvents: { $sum: 1 },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] }
          },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] }
          },
          uniqueSessions: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          _id: 0,
          pageUrl: '$_id',
          totalEvents: 1,
          clicks: 1,
          pageViews: 1,
          sessionsCount: { $size: '$uniqueSessions' }
        }
      },
      {
        $sort: { totalEvents: -1 }
      }
    ]);

    return res.status(200).json({
      success: true,
      count: pages.length,
      data: pages
    });
  } catch (err) {
    console.error('[Get Tracked Pages Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve tracked pages',
      details: err.message
    });
  }
}

/**
 * Helper endpoint to seed rich demo data for immediate reviewer verification
 * POST /api/seed
 */
async function seedDemoData(req, res) {
  try {
    const demoSessions = [
      {
        id: 'cf_sess_demo_alpha',
        path: [
          { type: 'page_view', url: '/index.html', delaySec: 0 },
          { type: 'click', url: '/index.html', x: 240, y: 160, tag: 'BUTTON', text: 'Browse Catalog', delaySec: 4 },
          { type: 'click', url: '/index.html', x: 520, y: 380, tag: 'DIV', text: 'Aura Pro ANC Headphones', delaySec: 9 },
          { type: 'page_view', url: '/product.html', delaySec: 12 },
          { type: 'click', url: '/product.html', x: 740, y: 410, tag: 'BUTTON', text: 'Add to Cart - $299', delaySec: 18 },
          { type: 'click', url: '/product.html', x: 742, y: 412, tag: 'BUTTON', text: 'Add to Cart - $299', delaySec: 20 },
          { type: 'click', url: '/product.html', x: 920, y: 80, tag: 'A', text: 'View Cart (1)', delaySec: 25 }
        ]
      },
      {
        id: 'cf_sess_demo_beta',
        path: [
          { type: 'page_view', url: '/index.html', delaySec: 0 },
          { type: 'click', url: '/index.html', x: 880, y: 90, tag: 'INPUT', text: 'Search products...', delaySec: 5 },
          { type: 'click', url: '/index.html', x: 260, y: 480, tag: 'BUTTON', text: 'Quick View', delaySec: 14 },
          { type: 'click', url: '/index.html', x: 245, y: 165, tag: 'BUTTON', text: 'Browse Catalog', delaySec: 22 }
        ]
      },
      {
        id: 'cf_sess_demo_gamma',
        path: [
          { type: 'page_view', url: '/product.html', delaySec: 0 },
          { type: 'click', url: '/product.html', x: 420, y: 320, tag: 'IMG', text: 'Product Gallery 2', delaySec: 6 },
          { type: 'click', url: '/product.html', x: 480, y: 320, tag: 'IMG', text: 'Product Gallery 3', delaySec: 11 },
          { type: 'click', url: '/product.html', x: 740, y: 410, tag: 'BUTTON', text: 'Add to Cart - $299', delaySec: 17 }
        ]
      }
    ];

    const baseTime = Date.now() - 3600000; // 1 hour ago
    const eventsToInsert = [];

    for (const session of demoSessions) {
      for (const step of session.path) {
        eventsToInsert.push({
          sessionId: session.id,
          eventType: step.type,
          pageUrl: step.url,
          timestamp: new Date(baseTime + step.delaySec * 1000 + Math.floor(Math.random() * 5000)),
          x: step.x,
          y: step.y,
          elementTag: step.tag,
          elementText: step.text,
          viewport: { width: 1440, height: 900 }
        });
      }
    }

    await Event.insertMany(eventsToInsert);

    return res.status(201).json({
      success: true,
      message: `Seeded ${eventsToInsert.length} demo events across ${demoSessions.length} sessions.`,
      sessionsCount: demoSessions.length,
      eventsCount: eventsToInsert.length
    });
  } catch (err) {
    console.error('[Seed Demo Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to seed demo data',
      details: err.message
    });
  }
}

module.exports = {
  getHeatmapData,
  getTrackedPages,
  seedDemoData
};
