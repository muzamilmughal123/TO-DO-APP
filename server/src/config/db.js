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

  const uri = 'mongodb+srv://appuser:AppUser12345@cluster0.irefmqn.mongodb.net/todoapp?retryWrites=true&w=majority';

  // Normal path — connect once and cache the promise so concurrent cold-start
  // invocations don't race to open multiple connections.
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        connectTimeoutMS: 10000,
      })
      .then((m) => {
        console.log(`MongoDB Connected: ${m.connection.host}`);
        return m;
      })
      .catch((err) => {
        // Reset the cached promise on failure so the next invocation retries.
        console.error('MongoDB connection error details:', err);
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // In serverless, never call process.exit() — it kills the entire function
    // worker.  Let the error propagate so the request returns a 500 instead.
    console.error('Database connection error:', err);
    throw err;
  }

  return cached.conn;
};

module.exports = connectDB;
