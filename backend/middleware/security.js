const crypto = require('crypto');
const {
  recordGraduatedIpStrike,
  isIpTemporarilyBlocked
} = require('../config/redis');

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
 * In-Memory 24-Hour IP Jail Store
 * Tracks IPs flagged for malicious automated behavior (e.g., Honeypot bot traps).
 */
const ipJail = new Map();

// Periodic cleanup of expired jail entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipJail.entries()) {
    if (now > entry.bannedUntil) {
      ipJail.delete(ip);
    }
  }
}, 15 * 60 * 1000).unref();

function jailIp(ip, durationMs = 15 * 60 * 1000, reason = 'Honeypot automated bot') {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'unknown') return;
  const entry = ipJail.get(ip) || { count: 0 };
  entry.count += 1;

  // Graduated strike duration (never permanently block an IP on 1 suspicious request):
  // Strike 1-2: warning only; Strike 3-4: 15 min; Strike 5+: up to 24h
  let effectiveDurationMs = 0;
  if (entry.count >= 5) {
    effectiveDurationMs = Math.min(durationMs, 24 * 60 * 60 * 1000);
  } else if (entry.count >= 3) {
    effectiveDurationMs = 15 * 60 * 1000;
  }

  entry.bannedUntil = effectiveDurationMs > 0 ? Date.now() + effectiveDurationMs : 0;
  entry.reason = reason;
  ipJail.set(ip, entry);

  // Also record graduated strike in Redis Cloud (Goldfish) asynchronously
  recordGraduatedIpStrike(ip, reason).catch(() => null);

  if (effectiveDurationMs > 0) {
    console.warn(
      `[Security Graduated IP Protection] IP ${ip} (strike #${entry.count}) restricted until ${new Date(entry.bannedUntil).toISOString()} (Reason: ${reason})`
    );
  }
}

function isIpJailed(ip) {
  if (!ip) return false;
  const entry = ipJail.get(ip);
  if (!entry || !entry.bannedUntil) return false;
  if (Date.now() > entry.bannedUntil) {
    ipJail.delete(ip);
    return false;
  }
  return true;
}

/**
 * Global IP Jail Check Middleware
 * Intercepts incoming requests before routes. Checks graduated strikes in memory + Redis Cloud.
 */
async function ipJailCheckMiddleware(req, res, next) {
  const clientIp =
    (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0].trim()) ||
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown';

  if (isIpJailed(clientIp)) {
    const entry = ipJail.get(clientIp);
    const retryAfterSec = Math.max(1, Math.ceil(((entry?.bannedUntil || Date.now()) - Date.now()) / 1000));
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(403).json({
      success: false,
      error: 'Access denied. Automated security defenses have temporarily restricted access from this network.',
      retryAfterSeconds: retryAfterSec
    });
  }

  const redisBlock = await isIpTemporarilyBlocked(clientIp).catch(() => ({ blocked: false }));
  if (redisBlock && redisBlock.blocked) {
    const retryAfterSec = Math.max(1, redisBlock.retryAfterSeconds || 60);
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(403).json({
      success: false,
      error: 'Access denied. Automated security defenses have temporarily restricted access from this network.',
      retryAfterSeconds: retryAfterSec
    });
  }

  next();
}

/**
 * Honeypot Anti-Spam Bot Trap Middleware with Tarpitting and 24-Hour IP Jail
 * 1. Jails the bot's IP for 24 hours.
 * 2. Tarpits (delays) response for 4 seconds to drain the bot's thread resources.
 * 3. Returns synthetic 200 OK so the bot records a success and does not attempt workarounds.
 */
function honeypotMiddleware(fieldName = '_hp_website', tarpitDelayMs = 4000) {
  return async (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') return next();

    const trapValue =
      req.body[fieldName] ||
      req.body._hp_website ||
      req.body.website_url ||
      req.body._honeypot;

    if (trapValue && String(trapValue).trim().length > 0) {
      const clientIp =
        (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0].trim()) ||
        req.ip ||
        req.socket?.remoteAddress ||
        'unknown';

      console.warn(`[Security Honeypot] Bot trapped from IP ${clientIp}: trapField=${fieldName}, value=${trapValue}`);

      // 1. Jail IP for 24 hours
      jailIp(clientIp, 24 * 60 * 60 * 1000, `Honeypot trap triggered (trap=${trapValue})`);

      // 2. Tarpit: Hold the connection open for 4 seconds to exhaust the bot's socket and memory
      await new Promise((resolve) => setTimeout(resolve, tarpitDelayMs));

      // 3. Return deceptive 200 OK
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
  ipJailCheckMiddleware,
  jailIp,
  isIpJailed,
  getTrustedFrontendOrigin,
  computeDedupFingerprint
};
