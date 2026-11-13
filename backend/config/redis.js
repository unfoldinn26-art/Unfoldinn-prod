const Redis = require('ioredis');
const crypto = require('crypto');

// ============================================================================
// THE GOLDFISH LAYER: Disposable Redis Cloud Client + Atomic Lua Scripts
// ============================================================================

let redisClient = null;
let redisReady = false;

// In-memory fallback map ONLY used if Redis Cloud is temporarily unreachable
const fallbackMemory = new Map();

function initRedis() {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn('[Goldfish Redis] REDIS_URL not set; running with disposable in-memory fallback.');
    return null;
  }

  redisClient = new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    connectTimeout: 5000,
    lazyConnect: false,
    retryStrategy(times) {
      return Math.min(times * 500, 5000);
    }
  });

  redisClient.on('ready', () => {
    redisReady = true;
    console.log('🐠 [Goldfish Redis Cloud] Connected & Ready');
  });

  redisClient.on('error', (err) => {
    redisReady = false;
    console.warn('[Goldfish Redis Notice]:', err.message);
  });

  redisClient.on('end', () => {
    redisReady = false;
  });

  return redisClient;
}

function isRedisConnected() {
  return Boolean(redisClient && redisReady && redisClient.status === 'ready');
}

// Standardized Redis Key Builders
const RedisKeys = {
  emailOtp: (email) => `otp:email:${String(email).trim().toLowerCase()}`,
  phoneOtp: (phone) => `otp:phone:${String(phone).trim()}`,
  otpCooldown: (target) => `otp:cooldown:${String(target).trim().toLowerCase()}`,
  rateLimit: (policy, ip) => `ratelimit:${policy}:ip:${ip}`,
  ipStrike: (ip) => `ip:strike:${ip}`,
  ipBlock: (ip) => `ip:block:${ip}`,
  slotLock: (mentorProfileId, slotKey) => `slotlock:${mentorProfileId}:${slotKey}`,
  cacheMentor: (idOrSlug) => `cache:mentor:${idOrSlug}`,
  cacheSettings: () => `cache:settings`,
  settingsCache: () => `cache:settings`,
  cachePlans: () => `cache:plans`,
  cacheSlots: (mentorProfileId, datePart) => `cache:slots:${mentorProfileId}:${datePart}`,
  slotsCache: (mentorProfileId, datePart) => `cache:slots:${mentorProfileId}:${datePart}`,
  cachePublic: (resourceKey) => `cache:public:${resourceKey}`
};

// ============================================================================
// 1. ATOMIC COMPARE-AND-DELETE (CAD) SLOT LOCK (Prevents Stale Lock Deletion)
// ============================================================================

const LUA_COMPARE_AND_DELETE = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

/**
 * Acquire a 15-minute tokenized temporary slot lock in Redis.
 * Returns { acquired: boolean, lockToken: string, degradedFallback: boolean }
 */
async function acquireRedisSlotHold(mentorProfileId, slotKey, ttlSeconds = 900) {
  const lockToken = crypto.randomUUID();
  const key = RedisKeys.slotLock(mentorProfileId, slotKey);

  if (isRedisConnected()) {
    try {
      const res = await redisClient.set(key, lockToken, 'PX', ttlSeconds * 1000, 'NX');
      return { acquired: res === 'OK', lockToken, degradedFallback: false };
    } catch (err) {
      console.warn('[Redis SlotHold Fallback to PG]:', err.message);
    }
  }

  // Disposable fallback: PostgreSQL remains the authoritative lock
  return { acquired: true, lockToken, degradedFallback: true };
}

/**
 * Atomically release a Redis slot lock ONLY if its value matches `lockToken` (Compare-and-Delete).
 */
async function releaseRedisSlotHold(mentorProfileId, slotKey, lockToken) {
  if (!lockToken) return false;
  const key = RedisKeys.slotLock(mentorProfileId, slotKey);

  if (isRedisConnected()) {
    try {
      const deleted = await redisClient.eval(LUA_COMPARE_AND_DELETE, 1, key, lockToken);
      return deleted === 1;
    } catch (err) {
      return false;
    }
  }
  return false;
}

// ============================================================================
// 2. ATOMIC OTP STORAGE, COOLDOWN & 5-ATTEMPT SELF-DESTRUCT (HMAC HASH ONLY)
// ============================================================================

const LUA_VERIFY_OTP_ATTEMPT = `
local raw = redis.call("get", KEYS[1])
if not raw then
  return cjson.encode({ status = "EXPIRED_OR_NOT_FOUND" })
end
local data = cjson.decode(raw)
local attempts = tonumber(data.attempts or 0) + 1
if attempts > 5 then
  redis.call("del", KEYS[1])
  return cjson.encode({ status = "LOCKED_OUT", attempts = attempts })
end
if data.otpHash == ARGV[1] then
  redis.call("del", KEYS[1])
  return cjson.encode({
    status = "VERIFIED",
    attempts = attempts,
    name = data.name,
    purpose = data.purpose,
    pendingPasswordHash = data.pendingPasswordHash
  })
end
if attempts >= 5 then
  redis.call("del", KEYS[1])
  return cjson.encode({ status = "LOCKED_OUT_ON_5TH", attempts = attempts })
end
data.attempts = attempts
local ttl = redis.call("ttl", KEYS[1])
if ttl < 1 then ttl = 60 end
redis.call("setex", KEYS[1], ttl, cjson.encode(data))
return cjson.encode({ status = "INVALID_CODE", attempts = attempts, remaining = 5 - attempts })
`;

async function checkOtpCooldown(target) {
  const key = RedisKeys.otpCooldown(target);
  if (isRedisConnected()) {
    try {
      const ttl = await redisClient.ttl(key);
      if (ttl > 0) return { onCooldown: true, retryAfterSeconds: ttl };
      return { onCooldown: false, retryAfterSeconds: 0 };
    } catch (err) {}
  }
  const mem = fallbackMemory.get(key);
  if (mem && mem.expiresAt > Date.now()) {
    return { onCooldown: true, retryAfterSeconds: Math.ceil((mem.expiresAt - Date.now()) / 1000) };
  }
  return { onCooldown: false, retryAfterSeconds: 0 };
}

async function storeOtpInGoldfish({
  key,
  otpKey,
  cooldownTarget,
  cooldownKey,
  otpHash,
  name = '',
  purpose = 'email_verify',
  pendingPasswordHash = null,
  ttlSeconds = 600,
  cooldownSeconds = 60
}) {
  const resolvedKey = key || otpKey;
  const cdKey = cooldownKey || RedisKeys.otpCooldown(cooldownTarget || resolvedKey);
  const payload = JSON.stringify({
    otpHash,
    attempts: 0,
    name,
    purpose,
    pendingPasswordHash,
    createdAt: Date.now()
  });

  if (isRedisConnected()) {
    try {
      const pipeline = redisClient.pipeline();
      pipeline.setex(resolvedKey, ttlSeconds, payload);
      pipeline.setex(cdKey, cooldownSeconds, '1');
      await pipeline.exec();
      return true;
    } catch (err) {
      console.warn('[Redis OTP Store Fallback]:', err.message);
    }
  }

  fallbackMemory.set(resolvedKey, {
    data: JSON.parse(payload),
    expiresAt: Date.now() + ttlSeconds * 1000
  });
  fallbackMemory.set(cdKey, {
    expiresAt: Date.now() + cooldownSeconds * 1000
  });
  return true;
}

async function verifyOtpInGoldfish(keyOrObj, candidateHashArg) {
  const key = typeof keyOrObj === 'object' && keyOrObj !== null ? keyOrObj.key || keyOrObj.otpKey : keyOrObj;
  const candidateHash =
    typeof keyOrObj === 'object' && keyOrObj !== null
      ? keyOrObj.expectedHash || keyOrObj.candidateHash
      : candidateHashArg;

  if (isRedisConnected()) {
    try {
      const rawResult = await redisClient.eval(LUA_VERIFY_OTP_ATTEMPT, 1, key, candidateHash);
      return JSON.parse(rawResult);
    } catch (err) {
      console.warn('[Redis OTP Verify Fallback]:', err.message);
    }
  }

  // Fallback in-memory atomic simulation
  const entry = fallbackMemory.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    fallbackMemory.delete(key);
    return { status: 'EXPIRED_OR_NOT_FOUND' };
  }
  entry.data.attempts = (entry.data.attempts || 0) + 1;
  if (entry.data.attempts > 5) {
    fallbackMemory.delete(key);
    return { status: 'LOCKED_OUT', attempts: entry.data.attempts };
  }
  const isMatch =
    Buffer.byteLength(candidateHash, 'hex') === Buffer.byteLength(entry.data.otpHash, 'hex') &&
    crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(entry.data.otpHash, 'hex'));

  if (isMatch) {
    const saved = { ...entry.data };
    fallbackMemory.delete(key);
    return {
      status: 'VERIFIED',
      attempts: saved.attempts,
      name: saved.name,
      purpose: saved.purpose,
      pendingPasswordHash: saved.pendingPasswordHash
    };
  }
  if (entry.data.attempts >= 5) {
    fallbackMemory.delete(key);
    return { status: 'LOCKED_OUT_ON_5TH', attempts: entry.data.attempts };
  }
  return {
    status: 'INVALID_CODE',
    attempts: entry.data.attempts,
    remaining: 5 - entry.data.attempts
  };
}

// ============================================================================
// 3. GRADUATED IP STRIKE & RATE LIMITING (Never Permanently Blocks on 1 Request)
// ============================================================================

async function recordGraduatedIpStrike(ip, reason = 'Suspicious activity', strikeThreshold = 3) {
  const strikeKey = RedisKeys.ipStrike(ip);
  const blockKey = RedisKeys.ipBlock(ip);

  if (isRedisConnected()) {
    try {
      const strikes = await redisClient.incr(strikeKey);
      if (strikes === 1) {
        await redisClient.expire(strikeKey, 3600); // 1-hour strike window
      }
      if (strikes >= strikeThreshold) {
        // Temporary 6-hour block after repeated threshold violations (not on a single request)
        await redisClient.setex(blockKey, 6 * 3600, JSON.stringify({ strikes, reason, blockedAt: Date.now() }));
        return { blocked: true, strikes };
      }
      return { blocked: false, strikes };
    } catch (err) {}
  }

  return { blocked: false, strikes: 1 };
}

async function isIpTemporarilyBlocked(ip) {
  const blockKey = RedisKeys.ipBlock(ip);
  if (isRedisConnected()) {
    try {
      const val = await redisClient.get(blockKey);
      return Boolean(val);
    } catch (err) {}
  }
  return false;
}

// ============================================================================
// 4. DISPOSABLE HOT CACHE HELPERS (With Instant Invalidation)
// ============================================================================

async function getCachedJson(key) {
  if (!isRedisConnected()) return null;
  try {
    const raw = await redisClient.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

async function setCachedJson(key, value, ttlSeconds = 300) {
  if (!isRedisConnected()) return false;
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
}

async function invalidateCacheKeys(...keys) {
  if (!isRedisConnected() || !keys.length) return;
  try {
    await redisClient.del(...keys);
  } catch (err) {}
}

async function connectRedis() {
  const client = initRedis();
  if (!client) return null;
  if (client.status === 'ready') return client;
  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 4000);
    client.once('ready', () => {
      clearTimeout(timeout);
      resolve();
    });
    client.once('error', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  return client;
}

async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (err) {}
    redisClient = null;
    redisReady = false;
  }
}

module.exports = {
  initRedis,
  connectRedis,
  disconnectRedis,
  getRedisClient: () => redisClient,
  isRedisConnected,
  RedisKeys,
  acquireRedisSlotHold,
  releaseRedisSlotHold,
  checkOtpCooldown,
  storeOtpInGoldfish,
  verifyOtpInGoldfish,
  recordGraduatedIpStrike,
  isIpTemporarilyBlocked,
  getCachedJson,
  setCachedJson,
  invalidateCacheKeys,
  getCache: getCachedJson,
  setCache: setCachedJson,
  delCache: invalidateCacheKeys
};
