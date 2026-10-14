const mongoose = require('mongoose');

/**
 * Event Schema for telemetry event stream
 * Supports page views, generic clicks, and product-specific interactions:
 * - add_to_cart
 * - product_favorite
 * - product_unfavorite
 * - product_view
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
        values: [
          'page_view',
          'click',
          'add_to_cart',
          'product_favorite',
          'product_unfavorite',
          'product_view'
        ],
        message: 'Invalid eventType: {VALUE}.'
      },
      index: true
    },
    pageUrl: {
      type: String,
      required: [true, 'pageUrl is mandatory'],
      trim: true,
      index: true
    },
    pageTitle: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      required: [true, 'timestamp is mandatory'],
      default: Date.now,
      index: true
    },
    // Click coordinates (only mandatory if eventType === 'click')
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
    // Product Identification fields
    productId: {
      type: String,
      trim: true,
      index: true
    },
    productName: {
      type: String,
      trim: true
    },
    productCategory: {
      type: String,
      trim: true
    },
    // Source identifier to ensure strict data separation from dashboard
    source: {
      type: String,
      trim: true,
      default: 'demo_store',
      index: true
    },
    // Optional diagnostics
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
EventSchema.index({ sessionId: 1, timestamp: 1 });
EventSchema.index({ pageUrl: 1, eventType: 1 });
EventSchema.index({ eventType: 1, productId: 1 });
EventSchema.index({ source: 1, eventType: 1 });

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;
