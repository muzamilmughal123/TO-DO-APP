const http = require('http');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedDatabase = require('./config/seeder');
const { initSocket } = require('./services/socket');
const app = require('./app');

// Load env vars
dotenv.config();
// Start application with safe DB connection (don't crash process on initial DB errors)
;(async function start() {
  try {
    await connectDB();
    // seedDatabase may throw; handle but don't crash
    try {
      await seedDatabase();
    } catch (seedErr) {
      console.warn('Database seeding skipped or failed:', seedErr && seedErr.message ? seedErr.message : seedErr);
    }
  } catch (err) {
    console.error('Database connection failed on startup:', err && err.message ? err.message : err);
    // proceed to start the server anyway; app should handle DB-unavailable scenarios gracefully
  }

  const server = http.createServer(app);

  // Initialize Socket.io
  initSocket(server);

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
})();
