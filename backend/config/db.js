const mongoose = require('mongoose');
const { prisma, ensurePostgresEngineConstraints } = require('./prisma');
const { initRedis } = require('./redis');

let cachedPromise = null;
let pgInitialized = false;

const connectDB = async () => {
  // 1. Initialize Goldfish Redis Cloud (Disposable Ephemeral Store & Cache)
  initRedis();

  // 2. Initialize Elephant Neon PostgreSQL 18 (Primary ACID Source of Truth)
  if (!pgInitialized && process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await ensurePostgresEngineConstraints();
      pgInitialized = true;
      console.log('🐘 [Elephant Neon PostgreSQL 18] Connected & Engine Constraints Active');
    } catch (pgErr) {
      console.error('Neon PostgreSQL connection notice:', pgErr.message);
    }
  }

  // 3. Keep secondary MongoDB connection for legacy model bridge / optional mirror
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  cachedPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      maxIdleTimeMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
      heartbeatFrequencyMS: 10000,
      readPreference: 'primary',
      retryWrites: true,
      writeConcern: { w: 'majority', j: true }
    })
    .then((conn) => {
      console.log(`MongoDB Mirror Connected: ${conn.connection.host}`);
      return conn;
    })
    .catch((err) => {
      cachedPromise = null;
      console.error(`Error connecting to MongoDB: ${err.message}`);
      throw err;
    });

  return cachedPromise;
};

mongoose.connection.on('disconnected', () => {
  cachedPromise = null;
});

mongoose.connection.on('error', () => {
  cachedPromise = null;
});

module.exports = connectDB;
