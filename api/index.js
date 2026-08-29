// Vercel Serverless Function entry point.
//
// Vercel automatically discovers any file under /api/ and deploys it as a
// serverless function.  By re-exporting the Express app here, every request
// to /api/* on the Vercel deployment is handled by the same Express instance
// that runs on Railway — no code duplication required.
//
// NOTE: server/src/index.js is intentionally NOT used here because it calls
// http.createServer(), server.listen(), and Socket.io — none of which are
// compatible with a serverless execution model.

const app = require('../server/src/app');

module.exports = app;
