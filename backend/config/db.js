const mongoose = require('mongoose');

let cachedPromise = null;

const connectDB = async () => {
  // If already connected, return existing connection immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If already connecting, await that exact connection promise
  if (cachedPromise) {
    return cachedPromise;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const missingErr = new Error('MONGODB_URI environment variable is missing in project settings!');
    console.error(missingErr.message);
    throw missingErr;
  }

  // Optimized for Serverless + MongoDB Atlas (low-latency connection reuse, anti-stale socket detection)
  cachedPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      maxIdleTimeMS: 10000, // Closes idle sockets before Atlas terminates them to prevent hangs on lambda thaw
      maxPoolSize: 10,
      minPoolSize: 1,
      heartbeatFrequencyMS: 10000
    })
    .then((conn) => {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    })
    .catch((err) => {
      cachedPromise = null;
      console.error(`Error connecting to MongoDB: ${err.message}`);
      throw err;
    });

  return cachedPromise;
};

// Reconnect on drop & clean up stale cache
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost. Clearing cached promise...');
  cachedPromise = null;
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
  cachedPromise = null;
});

module.exports = connectDB;
