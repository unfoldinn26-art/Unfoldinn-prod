const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Booking = require('../models/Booking');
const UserSubscription = require('../models/UserSubscription');
const PaymentTransaction = require('../models/PaymentTransaction');
const EmailOtp = require('../models/EmailOtp');
const PhoneOtp = require('../models/PhoneOtp');
const { sendOtpEmail } = require('../services/emailOtp');
const { sendWelcomeEmail } = require('../services/emailService');
const {
  getGoogleIntegrationStatus,
  ensureBookingCalendarAndMeet
} = require('../services/googleMeetService');
const { normalizePhone10, sendPhoneOtpSms, isSmsGatewayConfigured } = require('../services/phoneOtp');
const { protectUser, protectAdmin } = require('../middleware/auth');
const { authLimiter, honeypotMiddleware } = require('../middleware/security');
const { verifyCaptcha } = require('../middleware/captcha');
const { sendSecurityAlertEmail } = require('../services/emailService');

function hashEmailOtp(email, otp) {
  return crypto
    .createHash('sha256')
    .update(`${String(email).toLowerCase().trim()}:${String(otp).trim()}:${process.env.JWT_SECRET}`)
    .digest('hex');
}

function hashPhoneOtp(phone10, otp) {
  return crypto
    .createHash('sha256')
    .update(`PHONE:${String(phone10).trim()}:${String(otp).trim()}:${process.env.JWT_SECRET}`)
    .digest('hex');
}

/**
 * Generate signed User JWT with explicit tokenType='user' claim
 */
function generateUserToken(userId) {
  return jwt.sign(
    { id: userId, tokenType: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * Link any historical guest bookings matching user's email or phone
 */
async function linkHistoricalBookings(user) {
  const orConditions = [];
  if (user.email) {
    orConditions.push({ email: user.email.toLowerCase() });
  }
  if (user.phone && user.phone.trim().length >= 10) {
    const cleanDigits = user.phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanDigits.length === 10) {
      orConditions.push({ phone: { $regex: cleanDigits + '$' } });
    }
  }

  if (orConditions.length === 0) return;

  await Booking.updateMany(
    { userId: null, $or: orConditions },
    { $set: { userId: user._id } }
  );
}

/**
 * Fetch user's active subscription & credit summary (auto-expiring outdated ones)
 */
async function getUserSubscriptionSummary(userId) {
  const now = new Date();

  // Auto-mark expired subscriptions
  await UserSubscription.updateMany(
    { userId, status: 'active', expiresAt: { $lte: now } },
    { $set: { status: 'expired' } }
  );

  // Auto-mark exhausted subscriptions
  await UserSubscription.updateMany(
    { userId, status: 'active', remainingCredits: { $lte: 0 } },
    { $set: { status: 'exhausted' } }
  );

  const activeSubscriptions = await UserSubscription.find({
    userId,
    status: 'active',
    remainingCredits: { $gt: 0 },
    expiresAt: { $gt: now }
  }).sort({ expiresAt: 1 }); // Use earliest expiring credits first

  const remainingCredits = activeSubscriptions.reduce(
    (sum, sub) => sum + (sub.remainingCredits || 0),
    0
  );

  const totalCredits = activeSubscriptions.reduce(
    (sum, sub) => sum + (sub.totalCredits || 0),
    0
  );

  const primarySubscription = activeSubscriptions[0] || null;
  const sessionCount = await Booking.countDocuments({
    userId,
    status: { $in: ['confirmed', 'completed', 'pending'] }
  });

  return {
    activeSubscription: primarySubscription,
    activeSubscriptions,
    remainingCredits,
    totalCredits,
    sessionCount
  };
}

/**
 * Verify Google Credential (supports both ID Token from Google Identity Services and OAuth2 Access Token)
 */
async function verifyGoogleCredential({ credential, accessToken }) {
  if (credential) {
    const resp = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!resp.ok) {
      throw new Error('Invalid Google ID token');
    }
    const payload = await resp.json();

    if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Google token client ID mismatch');
    }
    if (!payload.email || payload.email_verified === 'false') {
      throw new Error('Google account email is not verified');
    }
    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || payload.given_name || payload.email.split('@')[0],
      avatar: payload.picture || ''
    };
  }

  if (accessToken) {
    const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!resp.ok) {
      throw new Error('Invalid Google access token');
    }
    const payload = await resp.json();
    if (!payload.email || !payload.email_verified) {
      throw new Error('Google account email is not verified');
    }
    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || payload.given_name || payload.email.split('@')[0],
      avatar: payload.picture || ''
    };
  }

  throw new Error('Google credential or access token is required');
}

// @route   POST /api/auth/google
// @desc    Sign in or sign up with Google OAuth (1-click login)
// @access  Public
router.post('/google', authLimiter, async (req, res, next) => {
  try {
    const { credential, accessToken } = req.body;
    const googleProfile = await verifyGoogleCredential({ credential, accessToken });

    let user = await User.findOne({
      $or: [{ googleId: googleProfile.googleId }, { email: googleProfile.email }]
    });

    if (!user) {
      user = await User.create({
        googleId: googleProfile.googleId,
        email: googleProfile.email,
        name: googleProfile.name,
        avatar: googleProfile.avatar,
        authProvider: 'google',
        onboardingCompleted: false,
        lastLoginAt: new Date()
      });
      sendWelcomeEmail(user).catch((err) =>
        console.error('[Auth] Welcome email warning:', err.message)
      );
    } else {
      if (!user.googleId) user.googleId = googleProfile.googleId;
      if (googleProfile.avatar && !user.avatar) user.avatar = googleProfile.avatar;
      if (user.authProvider === 'email') user.authProvider = 'both';
      user.lastLoginAt = new Date();
      await user.save();
    }

    await linkHistoricalBookings(user);
    const subSummary = await getUserSubscriptionSummary(user._id);
    const token = generateUserToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user,
      ...subSummary
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Google authentication failed'
    });
  }
});

// @route   POST /api/auth/email/direct-login
// @desc    Direct instant sign-in or sign-up with Email (Email OTP verification turned off)
// @access  Public
router.post('/email/direct-login', authLimiter, async (req, res, next) => {
  try {
    const { email, name } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.'
      });
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const cleanName = String(name || '').trim() || normalizedEmail.split('@')[0];
      user = await User.create({
        name: cleanName,
        email: normalizedEmail,
        authProvider: 'email',
        onboardingCompleted: false,
        lastLoginAt: new Date()
      });
    } else {
      if (name && String(name).trim() && (!user.name || user.name === 'Participant')) {
        user.name = String(name).trim();
      }
      user.lastLoginAt = new Date();
      await user.save();
    }

    await linkHistoricalBookings(user);
    const subSummary = await getUserSubscriptionSummary(user._id);
    const token = generateUserToken(user._id);

    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.status(200).json({
      success: true,
      token,
      user: userObj,
      ...subSummary
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/email/send-otp
// @desc    Send 6-digit Email OTP verification code for email login/signup
// @access  Public (Rate-limited)
router.post('/email/send-otp', authLimiter, async (req, res, next) => {
  try {
    const { email, name } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.'
      });
    }

    // Enforce 45-second cooldown per email address to prevent OTP spam
    const existingOtp = await EmailOtp.findOne({ email: normalizedEmail }).select('+pendingPasswordHash');
    if (existingOtp && existingOtp.lastSentAt) {
      const elapsedSec = Math.floor((Date.now() - new Date(existingOtp.lastSentAt).getTime()) / 1000);
      if (elapsedSec < 45) {
        return res.status(429).json({
          success: false,
          error: `Please wait ${45 - elapsedSec} seconds before requesting another OTP.`,
          retryAfterSeconds: 45 - elapsedSec
        });
      }
    }

    const otpCode = String(crypto.randomInt(100000, 999999));
    const otpHash = hashEmailOtp(normalizedEmail, otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity
    const resolvedName = name
      ? String(name).trim().slice(0, 120)
      : existingOtp?.name || '';
    const resolvedPurpose = existingOtp?.purpose || 'email_verify';

    await EmailOtp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        name: resolvedName,
        purpose: resolvedPurpose,
        ...(existingOtp?.pendingPasswordHash
          ? { pendingPasswordHash: existingOtp.pendingPasswordHash }
          : {}),
        otpHash,
        attempts: 0,
        lastSentAt: new Date(),
        expiresAt
      },
      { upsert: true, new: true }
    );

    const delivery = await sendOtpEmail({
      email: normalizedEmail,
      otp: otpCode,
      name: resolvedName,
      purpose: resolvedPurpose
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
      email: normalizedEmail,
      purpose: resolvedPurpose,
      expiresInSeconds: 600,
      retryAfterSeconds: 45,
      emailDelivered: delivery.delivered,
      deliveryStatus: delivery.status
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/email/verify-otp
// @desc    Verify 6-digit Email OTP (for Sign-Up Email Verification OR Login 2FA) and issue JWT
// @access  Public (Rate-limited)
router.post('/email/verify-otp', authLimiter, async (req, res, next) => {
  try {
    const { email, otp, name, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const cleanOtp = String(otp || '').replace(/\s+/g, '');

    if (!normalizedEmail || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter the 6-digit verification code sent to your email.'
      });
    }

    const otpRecord = await EmailOtp.findOne({ email: normalizedEmail }).select('+pendingPasswordHash');
    if (!otpRecord || new Date() > new Date(otpRecord.expiresAt)) {
      if (otpRecord) await EmailOtp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired or was not found. Please request a new OTP.'
      });
    }

    if (otpRecord.attempts >= 5) {
      await EmailOtp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        error: 'Too many incorrect OTP attempts. Please request a new verification code.'
      });
    }

    const expectedHash = hashEmailOtp(normalizedEmail, cleanOtp);
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(otpRecord.otpHash, 'hex')
    );

    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        error: `Invalid verification code. ${5 - otpRecord.attempts} attempts remaining.`
      });
    }

    // OTP verified! Capture stored metadata and delete OTP record immediately so it can never be replayed
    const savedName = name || otpRecord.name || normalizedEmail.split('@')[0];
    const savedPasswordHash = otpRecord.pendingPasswordHash || null;
    await EmailOtp.deleteOne({ _id: otpRecord._id });

    let user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      user = new User({
        name: String(savedName).trim(),
        email: normalizedEmail,
        authProvider: 'email',
        onboardingCompleted: false,
        lastLoginAt: new Date()
      });
      if (savedPasswordHash) {
        user.passwordHash = savedPasswordHash;
      } else if (password && String(password).length >= 6) {
        await user.setPassword(String(password));
      }
      await user.save();
      sendWelcomeEmail(user).catch((err) =>
        console.error('[Auth] Welcome email warning:', err.message)
      );
    } else {
      if (name && String(name).trim() && !user.name) {
        user.name = String(name).trim();
      }
      if (savedPasswordHash && !user.passwordHash) {
        user.passwordHash = savedPasswordHash;
      } else if (password && String(password).length >= 6 && !user.passwordHash) {
        await user.setPassword(String(password));
      }
      user.lastLoginAt = new Date();
      await user.save();
    }

    await linkHistoricalBookings(user);
    const subSummary = await getUserSubscriptionSummary(user._id);
    const token = generateUserToken(user._id);

    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.status(200).json({
      success: true,
      token,
      user: userObj,
      ...subSummary
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/register
// @desc    Step 1 of Sign-Up: Validate Name, Email & Password and send 6-digit Email Verification OTP
// @access  Public (Protected by RateLimiter, Honeypot, reCAPTCHA)
router.post('/register', authLimiter, honeypotMiddleware(), verifyCaptcha, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }
    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.'
      });
    }

    const existing = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists. Please sign in instead.'
      });
    }

    // Hash password with bcrypt immediately so plaintext password is never stored
    const salt = await bcrypt.genSalt(10);
    const pendingPasswordHash = await bcrypt.hash(String(password), salt);

    const otpCode = String(crypto.randomInt(100000, 999999));
    const otpHash = hashEmailOtp(normalizedEmail, otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity
    const cleanName = String(name).trim().slice(0, 120);

    await EmailOtp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        name: cleanName,
        purpose: 'register',
        pendingPasswordHash,
        otpHash,
        attempts: 0,
        lastSentAt: new Date(),
        expiresAt
      },
      { upsert: true, new: true }
    );

    const delivery = await sendOtpEmail({
      email: normalizedEmail,
      otp: otpCode,
      name: cleanName,
      purpose: 'register'
    });

    res.status(200).json({
      success: true,
      requiresOtp: true,
      purpose: 'register',
      email: normalizedEmail,
      expiresInSeconds: 600,
      retryAfterSeconds: 45,
      emailDelivered: delivery.delivered,
      message: `A 6-digit email verification code has been sent to ${normalizedEmail}. Enter it below to verify your email and complete sign-up.`
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Step 1 of Sign-In: Verify Email & Password, then send 6-digit 2-Factor Auth (2FA) Email OTP
// @access  Public (Protected by RateLimiter & Honeypot)
router.post('/login', authLimiter, honeypotMiddleware(), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both email and password'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if account is temporarily locked due to brute-force attempts
    if (user.isLocked) {
      const waitMinutes = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        error: `Account temporarily locked due to repeated failed login attempts. Please wait ${waitMinutes} minute(s) before trying again.`
      });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: 'This account was created with Google. Please click "Continue with Google" to sign in.'
      });
    }

    const isMatch = await user.matchPassword(String(password));
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLoginAt = new Date();

      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
        await user.save();

        // Send automated security alert email to admin
        try {
          const clientIp = (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0].trim()) || req.ip;
          sendSecurityAlertEmail({
            eventType: 'Brute-Force Account Lockout Triggered',
            email: normalizedEmail,
            ip: clientIp,
            details: '5 consecutive failed password attempts. Account locked for 15 minutes.'
          }).catch(e => console.warn('Security alert email notice:', e.message));
        } catch (e) {}

        return res.status(423).json({
          success: false,
          error: 'Too many failed login attempts. For security, your account has been temporarily locked for 15 minutes.'
        });
      }

      await user.save();
      const remaining = 5 - user.failedLoginAttempts;
      return res.status(401).json({
        success: false,
        error: `Invalid email or password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before temporary lockout.`
      });
    }

    // Password verified! Reset failed login counters
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    // Password verified! Send 6-digit 2FA OTP to user's email
    const otpCode = String(crypto.randomInt(100000, 999999));
    const otpHash = hashEmailOtp(normalizedEmail, otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

    await EmailOtp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        name: user.name || '',
        purpose: 'login_2fa',
        pendingPasswordHash: null,
        otpHash,
        attempts: 0,
        lastSentAt: new Date(),
        expiresAt
      },
      { upsert: true, new: true }
    );

    const delivery = await sendOtpEmail({
      email: normalizedEmail,
      otp: otpCode,
      name: user.name || '',
      purpose: 'login_2fa'
    });

    res.status(200).json({
      success: true,
      requiresOtp: true,
      purpose: 'login_2fa',
      email: normalizedEmail,
      expiresInSeconds: 600,
      retryAfterSeconds: 45,
      emailDelivered: delivery.delivered,
      message: `Password verified! We sent a 6-digit 2-Factor Authentication (2FA) code to ${normalizedEmail}.`
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged-in mentee profile + active subscription credits
// @access  Private (User)
router.get('/me', protectUser, async (req, res, next) => {
  try {
    await linkHistoricalBookings(req.user);
    const subSummary = await getUserSubscriptionSummary(req.user._id);

    res.status(200).json({
      success: true,
      user: req.user,
      ...subSummary
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/phone/send-otp
// @desc    Send 6-digit OTP to user's mobile number for Phone Verification
// @access  Private (User)
router.post('/phone/send-otp', authLimiter, protectUser, async (req, res, next) => {
  try {
    const cleanPhone = normalizePhone10(req.body.phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit mobile number.'
      });
    }

    // Enforce 45-second cooldown per phone number
    const existingOtp = await PhoneOtp.findOne({ phone: cleanPhone });
    if (existingOtp && existingOtp.lastSentAt) {
      const elapsedSec = Math.floor((Date.now() - new Date(existingOtp.lastSentAt).getTime()) / 1000);
      if (elapsedSec < 45) {
        return res.status(429).json({
          success: false,
          error: `Please wait ${45 - elapsedSec} seconds before requesting another Phone OTP.`,
          retryAfterSeconds: 45 - elapsedSec
        });
      }
    }

    const otpCode = String(crypto.randomInt(100000, 999999));
    const otpHash = hashPhoneOtp(cleanPhone, otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

    await PhoneOtp.findOneAndUpdate(
      { phone: cleanPhone },
      {
        phone: cleanPhone,
        otpHash,
        attempts: 0,
        lastSentAt: new Date(),
        expiresAt
      },
      { upsert: true, new: true }
    );

    const isConfigured = isSmsGatewayConfigured();
    if (!isConfigured) {
      return res.status(400).json({
        success: false,
        error: 'SMS service is not configured yet. Add TWO_FACTOR_API_KEY or FAST2SMS_API_KEY to your backend environment to send live SMS OTPs.',
        smsConfigured: false
      });
    }

    const smsDelivery = await sendPhoneOtpSms({
      phone: cleanPhone,
      otpCode
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to +91 ${cleanPhone}.`,
      phone: cleanPhone,
      expiresInSeconds: 600,
      smsConfigured: true
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/phone/verify-otp
// @desc    Verify 6-digit Phone OTP and mark user's mobile number as verified
// @access  Private (User)
router.post('/phone/verify-otp', authLimiter, protectUser, async (req, res, next) => {
  try {
    const cleanPhone = normalizePhone10(req.body.phone);
    const cleanOtp = String(req.body.otp || '').replace(/\s+/g, '');

    if (!cleanPhone || cleanPhone.length !== 10 || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit mobile number and the 6-digit OTP.'
      });
    }

    const otpRecord = await PhoneOtp.findOne({ phone: cleanPhone });
    if (!otpRecord || new Date() > new Date(otpRecord.expiresAt)) {
      if (otpRecord) await PhoneOtp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        error: 'Phone OTP has expired or was not found. Please request a new OTP.'
      });
    }

    if (otpRecord.attempts >= 5) {
      await PhoneOtp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        error: 'Too many incorrect Phone OTP attempts. Please request a new code.'
      });
    }

    const expectedHash = hashPhoneOtp(cleanPhone, cleanOtp);
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(otpRecord.otpHash, 'hex')
    );

    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        error: `Invalid Phone OTP. ${5 - otpRecord.attempts} attempts remaining.`
      });
    }

    // Verified! Delete OTP record immediately to prevent replay
    await PhoneOtp.deleteOne({ _id: otpRecord._id });

    req.user.phone = cleanPhone;
    req.user.whatsapp = cleanPhone;
    req.user.phoneVerified = true;
    req.user.phoneVerifiedAt = new Date();
    await req.user.save();

    res.status(200).json({
      success: true,
      message: `Mobile number +91 ${cleanPhone} verified successfully!`,
      phone: cleanPhone,
      phoneVerified: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/onboarding
// @desc    Complete one-time post-signup onboarding (or update profile)
// @access  Private (User)
router.put('/onboarding', protectUser, async (req, res, next) => {
  try {
    const {
      name,
      userType,
      phone,
      whatsapp,
      age,
      parentName,
      parentPhone,
      parentEmail,
      parentRelation,
      parentConsentConfirmed,
      whereCurrently,
      institutionOrOrg,
      city,
      source,
      referredBy
    } = req.body;

    const cleanPhone = normalizePhone10(phone || req.user.phone || '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'A valid 10-digit mobile / WhatsApp number is required.'
      });
    }

    req.user.phoneVerified = true;

    const resolvedUserType = ['student', 'parent', 'institution', 'other'].includes(userType)
      ? userType
      : 'student';

    const parsedAge = age !== undefined && age !== '' ? Number(age) : req.user.age;
    if (resolvedUserType === 'student' && (!parsedAge || parsedAge < 10 || parsedAge > 99)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid age between 10 and 99.'
      });
    }

    const isUnder18 = resolvedUserType === 'student' && parsedAge < 18;
    if (isUnder18) {
      if (!parentName || !parentPhone || !parentConsentConfirmed) {
        return res.status(400).json({
          success: false,
          error: 'For students under 18, parent/guardian name, contact number, and consent confirmation are mandatory.'
        });
      }
    }

    let computedAgeGroup = 'other';
    if (resolvedUserType === 'parent') computedAgeGroup = 'parent';
    else if (parsedAge >= 16 && parsedAge <= 18) computedAgeGroup = '16-18';
    else if (parsedAge >= 19 && parsedAge <= 21) computedAgeGroup = '19-21';
    else if (parsedAge >= 22 && parsedAge <= 25) computedAgeGroup = '22-25';

    if (name && String(name).trim()) req.user.name = String(name).trim();
    req.user.userType = resolvedUserType;
    req.user.phone = cleanPhone;
    req.user.whatsapp = whatsapp ? String(whatsapp).trim() : cleanPhone;
    if (parsedAge) req.user.age = parsedAge;
    req.user.ageGroup = computedAgeGroup;
    req.user.isUnder18 = isUnder18;

    if (isUnder18) {
      req.user.parentName = String(parentName).trim();
      req.user.parentPhone = String(parentPhone).trim();
      req.user.parentEmail = parentEmail ? String(parentEmail).trim().toLowerCase() : '';
      req.user.parentRelation = parentRelation ? String(parentRelation).trim() : 'Parent/Guardian';
      req.user.parentConsentConfirmed = Boolean(parentConsentConfirmed);
      req.user.parentConsentAt = new Date();
    } else {
      req.user.parentConsentConfirmed = false;
    }

    if (whereCurrently !== undefined) req.user.whereCurrently = whereCurrently;
    if (institutionOrOrg !== undefined) req.user.institutionOrOrg = String(institutionOrOrg).trim();
    if (city !== undefined) req.user.city = String(city).trim();
    if (source !== undefined) req.user.source = String(source).trim();
    if (referredBy !== undefined) req.user.referredBy = String(referredBy).trim();

    req.user.onboardingCompleted = true;
    if (!req.user.onboardingCompletedAt) {
      req.user.onboardingCompletedAt = new Date();
    }

    await req.user.save();
    await linkHistoricalBookings(req.user);
    const subSummary = await getUserSubscriptionSummary(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Profile saved! You never need to fill these details again.',
      user: req.user,
      ...subSummary
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/my-sessions
// @desc    Get logged-in user's complete session history, 7-day next steps, subscriptions & payment receipts
// @access  Private (User)
router.get('/my-sessions', protectUser, async (req, res, next) => {
  try {
    await linkHistoricalBookings(req.user);

    // Auto-provision Google Meet links for any confirmed sessions missing a meetingLink when Google Calendar is connected
    const gStatus = await getGoogleIntegrationStatus().catch(() => null);
    if (gStatus?.connected) {
      const unlinkedSessions = await Booking.find({
        userId: req.user._id,
        status: 'confirmed',
        $or: [{ meetingLink: null }, { meetingLink: '' }]
      }).limit(10);
      for (const s of unlinkedSessions) {
        await ensureBookingCalendarAndMeet(s).catch(() => null);
      }
    }

    const sessions = await Booking.find({ userId: req.user._id })
      .select('-notes -slotUpdateToken -calendarLastError') // Never expose private mentor notes to client
      .sort({ createdAt: -1 });

    const subscriptions = await UserSubscription.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    const transactions = await PaymentTransaction.find({
      userId: req.user._id,
      status: { $in: ['PAID', 'REFUNDED', 'PENDING', 'ACTIVE'] }
    })
      .select('-rawGatewaySummary')
      .sort({ createdAt: -1 });

    const subSummary = await getUserSubscriptionSummary(req.user._id);

    res.status(200).json({
      success: true,
      sessions,
      subscriptions,
      transactions,
      ...subSummary
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/auth/my-sessions/:id/reflection
// @desc    Allow student to update their 7-Day Next Step status, reflection, or session feedback
// @access  Private (User)
router.patch('/my-sessions/:id/reflection', protectUser, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Session record not found in your account'
      });
    }

    const { actionStatus, studentReflection, feedback, preferredDate, preferredTime } = req.body;

    if (actionStatus && ['not-started', 'pending', 'in-progress', 'completed', 'done'].includes(actionStatus)) {
      booking.actionStatus = actionStatus;
    }
    if (studentReflection !== undefined) {
      booking.studentReflection = String(studentReflection).slice(0, 1500);
    }
    if (feedback !== undefined) {
      booking.feedback = String(feedback).slice(0, 1000);
    }
    // Allow updating preferred slot if session is not yet completed/cancelled
    if (booking.status !== 'completed' && booking.status !== 'cancelled') {
      if (preferredDate) booking.preferredDate = preferredDate;
      if (preferredTime) booking.preferredTime = String(preferredTime).slice(0, 100);
    }

    await booking.save();

    const safeBooking = booking.toObject();
    delete safeBooking.notes;

    res.status(200).json({
      success: true,
      message: 'Your session progress has been updated.',
      data: safeBooking
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/admin/users
// @desc    Get all registered mentees with session counts & active subscriptions (Admin only)
// @access  Private (Admin)
router.get('/admin/users', protectAdmin, async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const activeSubs = await UserSubscription.find({ status: 'active' }).lean();
    const bookings = await Booking.find({ userId: { $ne: null } })
      .select('userId status createdAt topic actionAgreed actionStatus')
      .sort({ createdAt: -1 })
      .lean();

    const subByUser = new Map();
    for (const s of activeSubs) {
      const uid = String(s.userId);
      if (!subByUser.has(uid)) subByUser.set(uid, []);
      subByUser.get(uid).push(s);
    }

    const bookingsByUser = new Map();
    for (const b of bookings) {
      const uid = String(b.userId);
      if (!bookingsByUser.has(uid)) bookingsByUser.set(uid, []);
      bookingsByUser.get(uid).push(b);
    }

    const enriched = users.map((u) => {
      const uid = String(u._id);
      const userSubs = subByUser.get(uid) || [];
      const userBookings = bookingsByUser.get(uid) || [];
      const remainingCredits = userSubs.reduce((acc, s) => acc + (s.remainingCredits || 0), 0);

      return {
        ...u,
        activeSubscriptions: userSubs,
        remainingCredits,
        totalBookings: userBookings.length,
        recentBookings: userBookings.slice(0, 5)
      };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
