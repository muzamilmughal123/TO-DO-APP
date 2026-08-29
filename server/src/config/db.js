const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// Serverless-safe connection caching
// ---------------------------------------------------------------------------
// In a serverless environment (Vercel) each function invocation may reuse the
// same Node.js process across warm requests.  We cache the connection on the
// global object so that subsequent invocations in the same process skip the
// expensive mongoose.connect() round-trip entirely.
//
// In a long-running server (Railway / local dev) this is a no-op — the cached
// connection is established once on startup and reused for the lifetime of the
// process, exactly as before.
// ---------------------------------------------------------------------------

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // Return the cached connection immediately if it is already open.
  if (cached.conn) {
    return cached.conn;
  }

  // Build connection URI — support both MONGODB_URI and MONGO_URI env vars.
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    // No URI supplied — fall back to in-memory MongoDB (dev / CI only).
    console.warn('No MONGODB_URI or MONGO_URI env var found. Starting in-memory MongoDB fallback...');

    if (!cached.promise) {
      cached.promise = (async () => {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const memUri = mongoServer.getUri();
        console.log(`In-Memory MongoDB URI: ${memUri}`);
        return mongoose.connect(memUri, {
          bufferCommands: false,
          connectTimeoutMS: 10000,
        });
      })();
    }

    cached.conn = await cached.promise;
    return cached.conn;
  }

  // Normal path — connect once and cache the promise so concurrent cold-start
  // invocations don't race to open multiple connections.
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,      // fail fast instead of buffering ops
        connectTimeoutMS: 10000,    // surface timeout errors quickly
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => {
        console.log(`MongoDB Connected: ${m.connection.host}`);
        return m;
      })
      .catch((err) => {
        // Reset the cached promise on failure so the next invocation retries.
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // In serverless, never call process.exit() — it kills the entire function
    // worker.  Let the error propagate so the request returns a 500 instead.
    console.error(`Database connection error: ${err.message}`);
    throw err;
  }

  return cached.conn;
};

module.exports = connectDB;
