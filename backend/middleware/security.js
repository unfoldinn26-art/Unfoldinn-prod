const crypto = require('crypto');

/**
 * Recursive NoSQL Injection Sanitizer
 * Strips keys starting with '$' or containing '.' from objects/arrays in-place.
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      sanitizeObject(obj[i]);
    }
    return obj;
  }

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else {
      sanitizeObject(obj[key]);
    }
  }
  return obj;
}

const mongoSanitizeMiddleware = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};

/**
 * Escape special regex characters to prevent ReDoS attacks
 */
function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);
}

/**
 * Lightweight Sliding-Window Rate Limiter
 */
const buckets = new Map();

// Periodic cleanup of expired rate-limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    if (now > entry.resetAt) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 30, message = 'Too many requests, please try again later.', keyPrefix = 'global' }) {
  return (req, res, next) => {
    const ip =
      (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0].trim()) ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';

    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    let entry = buckets.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 1, resetAt: now + windowMs };
      buckets.set(key, entry);
    } else {
      entry.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));

    if (entry.count > max) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: retryAfterSec
      });
    }

    next();
  };
}

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: 'auth',
  message: 'Too many login or authentication attempts. Please wait 15 minutes and try again.'
});

const paymentLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyPrefix: 'payment',
  message: 'Too many payment requests from this IP. Please wait a few minutes before retrying.'
});

const publicFormLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  keyPrefix: 'form',
  message: 'Too many submissions in a short period. Please wait a few minutes.'
});

/**
 * Honeypot Anti-Spam Bot Trap Middleware
 * Silently catches automated spam scripts that autofill hidden trap fields.
 */
function honeypotMiddleware(fieldName = '_hp_website') {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') return next();

    const trapValue =
      req.body[fieldName] ||
      req.body._hp_website ||
      req.body.website_url ||
      req.body._honeypot;

    if (trapValue && String(trapValue).trim().length > 0) {
      console.warn(`[Security] Honeypot triggered from IP ${req.ip || 'unknown'}: trap=${trapValue}`);
      // Return synthetic success so the bot believes it completed and abandons retry
      return res.status(200).json({
        success: true,
        message: 'Submission received successfully.'
      });
    }

    next();
  };
}

/**
 * Strict Origin Whitelist Validator to prevent Open Redirect / Host Header Injection in payment returnUrl
 */
const ALLOWED_ORIGINS = [
  'https://unfoldinn.com',
  'https://www.unfoldinn.com',
  'https://second-innings.in',
  'https://www.second-innings.in',
  'https://second-innings-indol.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

function getTrustedFrontendOrigin(req) {
  const configured = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : 'http://localhost:3000';
  const candidateOrigin = req.headers.origin;

  if (candidateOrigin) {
    const clean = candidateOrigin.replace(/\/$/, '');
    if (ALLOWED_ORIGINS.includes(clean) || clean === configured) {
      return clean;
    }
  }

  return configured;
}

/**
 * Compute deterministic SHA-256 fingerprint for deduplicating rapid double-clicks
 */
function computeDedupFingerprint(parts) {
  return crypto
    .createHash('sha256')
    .update(parts.map((p) => String(p || '').trim().toLowerCase()).join('|'))
    .digest('hex')
    .slice(0, 32);
}

module.exports = {
  mongoSanitizeMiddleware,
  escapeRegex,
  createRateLimiter,
  authLimiter,
  paymentLimiter,
  publicFormLimiter,
  honeypotMiddleware,
  getTrustedFrontendOrigin,
  computeDedupFingerprint
};
