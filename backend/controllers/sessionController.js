const Event = require('../models/Event');

/**
 * Fetch a list of all sessions with event counts and metrics
 * GET /api/sessions
 */
async function getSessions(req, res) {
  try {
    const pipeline = [
      {
        $sort: { timestamp: 1 }
      },
      {
        $group: {
          _id: '$sessionId',
          totalEvents: { $sum: 1 },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] }
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] }
          },
          startedAt: { $min: '$timestamp' },
          lastActiveAt: { $max: '$timestamp' },
          pagesVisited: { $addToSet: '$pageUrl' },
          entryPage: { $first: '$pageUrl' },
          exitPage: { $last: '$pageUrl' }
        }
      },
      {
        $project: {
          _id: 0,
          sessionId: '$_id',
          totalEvents: 1,
          pageViews: 1,
          clicks: 1,
          startedAt: 1,
          lastActiveAt: 1,
          uniquePagesCount: { $size: '$pagesVisited' },
          entryPage: 1,
          exitPage: 1,
          durationSeconds: {
            $round: [
              {
                $divide: [
                  { $subtract: ['$lastActiveAt', '$startedAt'] },
                  1000
                ]
              },
              0
            ]
          }
        }
      },
      {
        $sort: { lastActiveAt: -1 } // Most recently active sessions first
      }
    ];

    const sessions = await Event.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (err) {
    console.error('[Get Sessions Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve sessions',
      details: err.message
    });
  }
}

/**
 * Fetch all events for a specific session in chronological order
 * GET /api/sessions/:sessionId/events
 */
async function getSessionEvents(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId URL parameter is required'
      });
    }

    const events = await Event.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No events found for session: ${sessionId}`,
        data: []
      });
    }

    // Add step number and relative elapsed time
    const startTime = new Date(events[0].timestamp).getTime();
    const enrichedEvents = events.map((ev, index) => {
      const currentTime = new Date(ev.timestamp).getTime();
      return {
        ...ev,
        step: index + 1,
        elapsedSeconds: Math.round((currentTime - startTime) / 1000)
      };
    });

    return res.status(200).json({
      success: true,
      sessionId,
      totalEvents: enrichedEvents.length,
      data: enrichedEvents
    });
  } catch (err) {
    console.error('[Get Session Events Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve events for session',
      details: err.message
    });
  }
}

module.exports = {
  getSessions,
  getSessionEvents
};
