// Vercel Serverless Function entry point.
//
// Vercel invokes this file as a serverless function for every /api/* request.
// We must ensure the Mongoose connection is established before Express handles
// the request — the connectDB() call is cached globally so warm invocations
// return immediately without re-connecting.
//
// NOTE: server/src/index.js is intentionally NOT used here because it calls
// http.createServer(), server.listen(), and Socket.io — none of which are
// compatible with a serverless execution model.

const app = require('../server/src/app');
const connectDB = require('../server/src/config/db');

// Wrap the Express app so the DB connection is always ready before the
// request reaches any route handler.
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
