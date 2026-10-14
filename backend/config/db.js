const mongoose = require('mongoose');

let mongoMemoryServer = null;

/**
 * Connect to MongoDB with automatic zero-config fallback
 * If MONGODB_URI is provided, connects to it (e.g. MongoDB Atlas or local instance).
 * If MONGODB_URI is absent or unreachable, starts an embedded MongoMemoryServer
 * so reviewers can run the application instantly without manual database setup.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[DB] Attempting connection to configured MONGODB_URI...`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[DB] Successfully connected to MongoDB at ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.warn(`[DB] Warning: Could not connect to configured MONGODB_URI: ${err.message}`);
      console.log(`[DB] Falling back to embedded in-memory MongoDB instance for seamless testing...`);
    }
  } else {
    console.log(`[DB] No MONGODB_URI defined in environment.`);
    console.log(`[DB] Starting embedded MongoDB instance (MongoMemoryServer)...`);
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'causalfunnel_analytics'
      }
    });
    const memoryUri = mongoMemoryServer.getUri();
    console.log(`[DB] MongoMemoryServer spun up at: ${memoryUri}`);

    const conn = await mongoose.connect(memoryUri);
    console.log(`[DB] Connected to embedded MongoDB in-memory database.`);
    return conn;
  } catch (memErr) {
    console.error(`[DB] Critical Error: Failed to start database connection: ${memErr.message}`);
    throw memErr;
  }
}

async function closeDB() {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}

module.exports = { connectDB, closeDB };
