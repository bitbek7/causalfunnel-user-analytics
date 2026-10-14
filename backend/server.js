const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();

const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');
const Event = require('./models/Event');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware stack
app.use(cors({
  origin: '*', // Allow demo storefront, React dashboard, and local tools
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '64kb' }));
app.use(morgan('dev'));

// Serve tracker.js directly from the server root for easy embedding
app.get('/tracker.js', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'tracker', 'tracker.js'));
});

// Serve the interactive demo website
app.use('/demo', express.static(path.join(__dirname, '..', 'demo')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    return res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date(),
      database: 'connected',
      totalRecordedEvents: totalEvents
    });
  } catch (err) {
    return res.status(500).json({
      status: 'degraded',
      error: err.message
    });
  }
});

// Mount core API endpoints
app.use('/api', apiRoutes);

// Root welcome & diagnostic route
app.get('/', (req, res) => {
  res.json({
    name: 'CausalFunnel Analytics API',
    version: '1.0.0',
    endpoints: {
      ingest: 'POST /api/events',
      sessions: 'GET /api/sessions',
      sessionEvents: 'GET /api/sessions/:sessionId/events',
      heatmap: 'GET /api/heatmap?pageUrl=/index.html',
      pages: 'GET /api/pages',
      health: 'GET /api/health',
      demoWebsite: 'http://localhost:' + PORT + '/demo'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server after database connection
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 CausalFunnel Analytics API listening on port ${PORT}`);
      console.log(`📡 Ingestion Endpoint: http://localhost:${PORT}/api/events`);
      console.log(`📊 Sessions API:      http://localhost:${PORT}/api/sessions`);
      console.log(`🗺️  Heatmap API:       http://localhost:${PORT}/api/heatmap`);
      console.log(`🛒 Demo Storefront:   http://localhost:${PORT}/demo`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error(`[Fatal] Failed to bootstrap application:`, err);
    process.exit(1);
  }
}

startServer();
