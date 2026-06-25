const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

let mongoServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // Try the configured Mongo URI first, if it exists.
    if (uri) {
      try {
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (primaryErr) {
        console.warn('Primary MongoDB connection failed:', primaryErr.message);
        console.warn('Attempting fallback to local MongoDB or in-memory MongoDB...');
      }
    }

    // If no URI or fallback connection failed, attempt local MongoDB first.
    try {
      const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/ai-task-manager', {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`MongoDB Connected (local): ${localConn.connection.host}`);
      return localConn;
    } catch (localErr) {
      console.warn('Local MongoDB not found or unavailable:', localErr.message);
      console.log('Starting in-memory MongoDB fallback...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log(`In-Memory MongoDB URI: ${uri}`);
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
