const http = require('http');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedDatabase = require('./config/seeder');
const { initSocket } = require('./services/socket');
const app = require('./app');

// Load env vars
dotenv.config();

// Connect to Database
connectDB().then(() => {
  seedDatabase();
});

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
