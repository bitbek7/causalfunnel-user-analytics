const mongoose = require('mongoose');

/**
 * Event Schema for telemetry event stream
 * Complies with CausalFunnel assignment requirements:
 * - session_id: user browsing session identifier
 * - event_type: 'page_view' or 'click'
 * - page_url: URL where event occurred
 * - timestamp: ISO client timestamp
 * - x, y: coordinates for click events
 */
const EventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: [true, 'sessionId is mandatory'],
      trim: true,
      index: true
    },
    eventType: {
      type: String,
      required: [true, 'eventType is mandatory'],
      enum: {
        values: ['page_view', 'click'],
        message: 'Invalid eventType: {VALUE}. Must be "page_view" or "click".'
      },
      index: true
    },
    pageUrl: {
      type: String,
      required: [true, 'pageUrl is mandatory'],
      trim: true,
      index: true
    },
    timestamp: {
      type: Date,
      required: [true, 'timestamp is mandatory'],
      default: Date.now,
      index: true
    },
    // Click coordinates (mandatory if eventType === 'click')
    x: {
      type: Number,
      required: [
        function () {
          return this.eventType === 'click';
        },
        'x coordinate is required for click events'
      ],
      min: [0, 'x coordinate cannot be negative']
    },
    y: {
      type: Number,
      required: [
        function () {
          return this.eventType === 'click';
        },
        'y coordinate is required for click events'
      ],
      min: [0, 'y coordinate cannot be negative']
    },
    // Optional diagnostics and responsive context
    viewport: {
      width: { type: Number },
      height: { type: Number }
    },
    elementTag: {
      type: String,
      trim: true
    },
    elementText: {
      type: String,
      trim: true,
      maxlength: 120
    },
    // Diagnostic server timestamp
    receivedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false,
    timestamps: false
  }
);

// Compound indexes for optimal query execution
// 1. For chronological user journey: find by sessionId sorted by timestamp
EventSchema.index({ sessionId: 1, timestamp: 1 });

// 2. For heatmap queries: find by pageUrl where eventType is 'click'
EventSchema.index({ pageUrl: 1, eventType: 1 });

// 3. For aggregate session listing
EventSchema.index({ eventType: 1, sessionId: 1 });

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;
