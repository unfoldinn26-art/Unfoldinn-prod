const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { mongoSanitizeMiddleware, ipJailCheckMiddleware } = require('./middleware/security');
const { router: subscriptionsRouter } = require('./routes/subscriptions');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Trust proxy for accurate IP rate limiting behind Render / Cloudflare / Vercel
app.set('trust proxy', 1);

// Security Middleware
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' } // Allows Google OAuth popup window
  })
);

// CORS configuration - allow production domain, Unfoldinn Vercel preview URLs only, and localhost
const allowedOrigins = [
  'https://unfoldinn.com',
  'https://www.unfoldinn.com',
  'https://second-innings.in',
  'https://www.second-innings.in',
  'https://second-innings-indol.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL
].filter(Boolean);

const ownVercelPreviewRegex = /^https:\/\/(unfoldinn|second-innings)[a-z0-9-]*\.vercel\.app$/i;

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || ownVercelPreviewRegex.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body Parser with Raw Body Capture (Required for cryptographic Cashfree Webhook HMAC-SHA256 verification)
app.use(
  express.json({
    limit: '100kb',
    verify: (req, res, buf) => {
      if (buf && buf.length) {
        req.rawBody = buf.toString('utf8');
      }
    }
  })
);

// Strip NoSQL injection operators ($gt, $ne, etc.) from body, query, and params
app.use(mongoSanitizeMiddleware);

// Intercept requests from IPs sentenced to the 24-Hour Security Jail
app.use(ipJailCheckMiddleware);

// Middleware to ensure active MongoDB connection before routing (fast-fail 503 instead of 10s Mongoose buffer hang)
app.use(async (req, res, next) => {
  if (req.path === '/' || req.path === '/api/health') return next();
  if (require('mongoose').connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (e) {
      console.warn('On-demand DB reconnect error:', e.message);
      res.setHeader('Retry-After', '3');
      return res.status(503).json({
        success: false,
        error: 'Database is temporarily reconnecting. Please try again in a few seconds.'
      });
    }
  }
  next();
});

// Health Check Route
app.get('/api/health', async (req, res) => {
  const { prisma } = require('./config/prisma');
  const { isRedisConnected } = require('./config/redis');
  let pgConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    pgConnected = true;
  } catch (_) {
    pgConnected = false;
  }
  const state = require('mongoose').connection.readyState;
  res.status(200).json({
    status: 'ok',
    architecture: 'elephant_neon_pg18_plus_goldfish_redis',
    postgres: pgConnected ? 'connected' : 'reconnecting',
    redis: isRedisConnected() ? 'connected' : 'fallback_mode',
    database: pgConnected || state === 1 ? 'connected' : 'disconnected',
    connected: pgConnected || state === 1
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/institutions', require('./routes/institutions'));
app.use('/api/opportunities', require('./routes/opportunities'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/support', require('./routes/support'));
app.use('/api/payment', require('./routes/payment'));

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Unfoldinn API', version: '2.0.0' });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server;
if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`Error: ${err.message}`);
    server?.close(() => process.exit(1));
  });
}

module.exports = app;
