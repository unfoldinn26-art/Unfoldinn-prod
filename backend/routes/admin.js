const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const Booking = require('../models/Booking');
const Contact = require('../models/Contact');
const InstitutionalEnquiry = require('../models/InstitutionalEnquiry');
const Opportunity = require('../models/Opportunity');
const Resource = require('../models/Resource');
const Testimonial = require('../models/Testimonial');
const Newsletter = require('../models/Newsletter');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const UserSubscription = require('../models/UserSubscription');
const EmailLog = require('../models/EmailLog');
const {
  createAdminGoogleAuthUrl,
  handleAdminGoogleCallback,
  getGoogleIntegrationStatus,
  disconnectGoogleIntegration,
  ensureBookingCalendarAndMeet
} = require('../services/googleMeetService');
const {
  generateSessionSummaryForBooking,
  updateAndApproveSessionSummary,
  getStudentContinuityBrief
} = require('../services/sessionSummaryService');
const { sendBookingStatusUpdateEmail, sendSecurityAlertEmail } = require('../services/emailService');
const { protectAdmin } = require('../middleware/auth');
const { authLimiter, honeypotMiddleware } = require('../middleware/security');
const { verifyCaptcha } = require('../middleware/captcha');

const generateToken = (id) => {
  return jwt.sign({ id, tokenType: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @route   POST /api/admin/login
// @desc    Auth admin & get token (Rate-Limited, Honeypot, reCAPTCHA v2, & 5-Attempt Lockout)
// @access  Public
router.post(
  '/login',
  authLimiter,
  honeypotMiddleware(),
  verifyCaptcha,
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    try {
      const admin = await Admin.findOne({ email: normalizedEmail });

      if (!admin) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      if (admin.isLocked) {
        const waitMinutes = Math.ceil((new Date(admin.lockUntil).getTime() - Date.now()) / (60 * 1000));
        return res.status(423).json({
          success: false,
          error: `Admin account temporarily locked due to repeated failed attempts. Please wait ${waitMinutes} minute(s) before trying again.`
        });
      }

      const isMatch = await admin.matchPassword(String(password));
      if (!isMatch) {
        const clientIp = (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0].trim()) || req.ip;
        admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
        admin.lastFailedLoginAt = new Date();
        console.warn(`[Security] Failed admin login attempt #${admin.failedLoginAttempts} for ${normalizedEmail} from IP ${clientIp}`);

        if (admin.failedLoginAttempts >= 5) {
          admin.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
          await admin.save();

          try {
            sendSecurityAlertEmail({
              eventType: 'Admin Portal Brute-Force Lockout Triggered',
              email: normalizedEmail,
              ip: clientIp,
              details: '5 consecutive failed admin password attempts. Admin account locked for 15 minutes.'
            }).catch((e) => console.warn('Admin security alert email notice:', e.message));
          } catch (e) {}

          return res.status(423).json({
            success: false,
            error: 'Too many failed login attempts. For security, this admin account has been locked for 15 minutes.'
          });
        }

        await admin.save();
        const remaining = 5 - admin.failedLoginAttempts;
        return res.status(401).json({
          success: false,
          error: `Invalid email or password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before 15-minute lockout.`
        });
      }

      if (!admin.isActive) {
        return res.status(401).json({ success: false, error: 'Account is deactivated' });
      }

      admin.failedLoginAttempts = 0;
      admin.lockUntil = null;
      admin.lastLogin = Date.now();
      await admin.save();

      res.json({
        success: true,
        token: generateToken(admin._id),
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/admin/me
// @desc    Get current logged in admin
// @access  Private (Admin)
router.get('/me', protectAdmin, async (req, res) => {
  res.json({
    success: true,
    data: req.admin
  });
});

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', protectAdmin, async (req, res, next) => {
  try {
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      totalContacts,
      newContacts,
      readContacts,
      repliedContacts,
      totalEnquiries,
      enquiriesByStatus,
      activeOpportunities,
      publishedResources,
      approvedTestimonials,
      activeSubscribers,
      totalSupportTickets,
      openSupportTickets,
      investigatingSupportTickets,
      resolvedSupportTickets,
      totalUsers,
      activeSubscriptionsCount,
      recentBookings,
      recentContacts,
      recentEnquiries,
      recentSupportTickets
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'completed' }),

      Contact.countDocuments(),
      Contact.countDocuments({ status: 'new' }),
      Contact.countDocuments({ status: 'read' }),
      Contact.countDocuments({ status: 'replied' }),

      InstitutionalEnquiry.countDocuments(),
      InstitutionalEnquiry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),

      Opportunity.countDocuments({ isActive: true }),
      Resource.countDocuments({ isPublished: true }),
      Testimonial.countDocuments({ isApproved: true }),
      Newsletter.countDocuments({ isActive: true }),

      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'investigating' }),
      SupportTicket.countDocuments({ status: 'resolved' }),

      User.countDocuments(),
      UserSubscription.countDocuments({ status: 'active' }),

      Booking.find().sort({ createdAt: -1 }).limit(5),
      Contact.find().sort({ createdAt: -1 }).limit(5),
      InstitutionalEnquiry.find().sort({ createdAt: -1 }).limit(5),
      SupportTicket.find().sort({ createdAt: -1 }).limit(5)
    ]);

    // Auto-provision Google Meet links for any confirmed recent bookings if Google Calendar is connected
    const gStatus = await getGoogleIntegrationStatus().catch(() => null);
    let updatedRecentBookings = recentBookings;
    if (gStatus?.connected && Array.isArray(recentBookings)) {
      let anyProvisioned = false;
      for (const b of recentBookings) {
        if (b.status === 'confirmed' && !b.meetingLink) {
          await ensureBookingCalendarAndMeet(b).catch(() => null);
          anyProvisioned = true;
        }
      }
      if (anyProvisioned) {
        updatedRecentBookings = await Booking.find().sort({ createdAt: -1 }).limit(8);
      }
    }

    const enquiryStatusMap = {};
    enquiriesByStatus.forEach((item) => {
      enquiryStatusMap[item._id] = item.count;
    });

    const flatStats = {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      totalUsers,
      activeSubscriptions: activeSubscriptionsCount,
      activeOpportunities,
      publishedResources,
      totalContacts,
      newContacts,
      institutionalEnquiries: totalEnquiries,
      approvedTestimonials,
      newsletterSubscribers: activeSubscribers,
      totalSupport: totalSupportTickets,
      openSupport: openSupportTickets,
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings
      },
      contacts: {
        total: totalContacts,
        new: newContacts,
        read: readContacts,
        replied: repliedContacts
      },
      institutions: {
        total: totalEnquiries,
        byStatus: enquiryStatusMap
      },
      support: {
        total: totalSupportTickets,
        open: openSupportTickets,
        investigating: investigatingSupportTickets,
        resolved: resolvedSupportTickets
      },
      users: {
        total: totalUsers,
        activeSubscriptions: activeSubscriptionsCount
      },
      opportunities: { active: activeOpportunities },
      resources: { published: publishedResources },
      testimonials: { approved: approvedTestimonials },
      newsletter: { active: activeSubscribers }
    };

    res.json({
      success: true,
      stats: flatStats,
      recentBookings: updatedRecentBookings,
      recentContacts,
      recentInstitutions: recentEnquiries,
      recentSupport: recentSupportTickets,
      data: {
        stats: flatStats,
        recentBookings: updatedRecentBookings,
        recentContacts,
        recentInstitutions: recentEnquiries,
        recentSupport: recentSupportTickets,
        recent: {
          bookings: updatedRecentBookings,
          contacts: recentContacts,
          institutions: recentEnquiries,
          support: recentSupportTickets
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/change-password
// @desc    Change admin password
// @access  Private (Admin)
router.put(
  '/change-password',
  protectAdmin,
  [
    body('currentPassword', 'Current password is required').exists(),
    body('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const admin = await Admin.findById(req.admin._id);
      const { currentPassword, newPassword } = req.body;

      if (!(await admin.matchPassword(currentPassword))) {
        return res.status(401).json({ success: false, error: 'Invalid current password' });
      }

      admin.password = newPassword;
      await admin.save();

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/admin/create
// @desc    Create a new admin
// @access  Private (Superadmin only)
router.post(
  '/create',
  protectAdmin,
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res, next) => {
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Not authorized to create admins' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      let admin = await Admin.findOne({ email: String(email).toLowerCase() });

      if (admin) {
        return res.status(400).json({ success: false, error: 'Admin already exists' });
      }

      admin = await Admin.create({
        name,
        email: String(email).toLowerCase(),
        password,
        role: role || 'admin'
      });

      res.status(201).json({
        success: true,
        data: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/admin/email-logs
// @desc    Inspect recent transactional email logs & delivery metrics
// @access  Private (Admin)
router.get('/email-logs', protectAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const filter = {};
    if (req.query.status) filter.status = String(req.query.status);
    if (req.query.workflow) filter.workflow = String(req.query.workflow);

    const [logs, totalSent, totalFailed, totalPendingDomain] = await Promise.all([
      EmailLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      EmailLog.countDocuments({ status: 'sent' }),
      EmailLog.countDocuments({ status: 'failed' }),
      EmailLog.countDocuments({ status: 'skipped_unverified_domain' })
    ]);

    res.status(200).json({
      success: true,
      summary: {
        sent: totalSent,
        failed: totalFailed,
        skippedUnverifiedDomain: totalPendingDomain
      },
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GOOGLE CALENDAR & GOOGLE MEET INTEGRATION ROUTES (ADMIN ONLY + CSRF CALLBACK)
// ============================================================================

// @route   GET /api/admin/google/status
// @desc    Get current Google Calendar & Meet OAuth connection status
// @access  Private (Admin)
router.get('/google/status', protectAdmin, async (req, res, next) => {
  try {
    const status = await getGoogleIntegrationStatus();
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/google/connect-url
// @desc    Generate CSRF-protected Google OAuth 2.0 authorization URL for Calendar & Meet
// @access  Private (Admin)
router.get('/google/connect-url', protectAdmin, async (req, res, next) => {
  try {
    const customRedirectUri = req.query.redirectUri ? String(req.query.redirectUri) : undefined;
    const result = await createAdminGoogleAuthUrl({
      adminId: req.admin._id,
      req,
      redirectUri: customRedirectUri
    });

    res.status(200).json({
      success: true,
      authUrl: result.authUrl,
      redirectUri: result.redirectUri,
      scopes: result.scopes,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/google/callback
// @desc    Handle Google OAuth 2.0 callback, verify CSRF state, and store encrypted refresh token
// @access  Public (Protected by signed JWT state + persisted SHA-256 nonce)
router.get('/google/callback', async (req, res) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .trim()
    .replace(/\/+$/, '');
  const wantsJson =
    req.query.format === 'json' ||
    String(req.headers.accept || '').includes('application/json');

  try {
    if (req.query.error) {
      throw new Error(`Google OAuth error: ${req.query.error}`);
    }

    const { code, state } = req.query;
    const result = await handleAdminGoogleCallback({ code, state });

    // Automatically generate Google Calendar events & Meet links for any existing confirmed bookings missing a Meet link
    try {
      const pendingMeetBookings = await Booking.find({
        status: 'confirmed',
        $or: [{ meetingLink: null }, { meetingLink: '' }]
      })
        .sort({ createdAt: -1 })
        .limit(20);

      for (const b of pendingMeetBookings) {
        await ensureBookingCalendarAndMeet(b).catch((e) =>
          console.warn('[Auto-Meet Backfill Warning]:', e.message)
        );
      }
    } catch (backfillErr) {
      console.warn('[Auto-Meet Backfill Error]:', backfillErr.message);
    }

    if (wantsJson) {
      return res.status(200).json({
        success: true,
        data: result
      });
    }

    return res.redirect(
      `${frontendUrl}/admin?google_connected=true&google_email=${encodeURIComponent(
        result.connectedEmail || ''
      )}`
    );
  } catch (error) {
    console.error('[Google OAuth Callback Error]:', error.message);
    if (wantsJson) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Google Calendar connection failed'
      });
    }
    return res.redirect(
      `${frontendUrl}/admin?google_error=${encodeURIComponent(
        error.message || 'Google Calendar connection failed'
      )}`
    );
  }
});

// @route   POST /api/admin/google/disconnect
// @desc    Disconnect Google Calendar & clear stored OAuth tokens
// @access  Private (Admin)
router.post('/google/disconnect', protectAdmin, async (req, res, next) => {
  try {
    const result = await disconnectGoogleIntegration();
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/bookings/:id/generate-meet
// @desc    Manually create or retry Google Calendar event & unique Google Meet link for a booking
// @access  Private (Admin)
router.post('/bookings/:id/generate-meet', protectAdmin, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const meetResult = await ensureBookingCalendarAndMeet(booking);
    const updatedBooking = await Booking.findById(req.params.id);

    if (meetResult.created && !meetResult.reusedExisting && updatedBooking.meetingLink) {
      await sendBookingStatusUpdateEmail(updatedBooking, 'google_meet_link_generated');
    }

    res.status(200).json({
      success: Boolean(meetResult.created),
      meetResult,
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SESSION CONTINUITY & 9-PART STRUCTURED SUMMARY ROUTES (ADMIN ONLY)
// ============================================================================

// @route   GET /api/admin/bookings/:id/continuity
// @desc    Get chronological student session history, continuity prep brief & current session summary
// @access  Private (Admin)
router.get('/bookings/:id/continuity', protectAdmin, async (req, res, next) => {
  try {
    const continuityData = await getStudentContinuityBrief(req.params.id);
    res.status(200).json({
      success: true,
      data: continuityData
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/bookings/:id/summary/generate
// @desc    Generate or regenerate the 9-part structured post-session summary
// @access  Private (Admin)
router.post('/bookings/:id/summary/generate', protectAdmin, async (req, res, next) => {
  try {
    const {
      meetNotesText,
      meetTranscriptText,
      mentorNotesText,
      forceRegenerate
    } = req.body || {};

    const result = await generateSessionSummaryForBooking(req.params.id, {
      meetNotesText,
      meetTranscriptText,
      mentorNotesText,
      forceRegenerate: Boolean(forceRegenerate)
    });

    res.status(200).json({
      success: true,
      deduplicated: result.deduplicated,
      data: result.summary
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/bookings/:id/summary
// @desc    Review, edit, correct, and approve a generated session summary
// @access  Private (Admin)
router.put('/bookings/:id/summary', protectAdmin, async (req, res, next) => {
  try {
    const updatedSummary = await updateAndApproveSessionSummary(
      req.params.id,
      req.body || {},
      req.admin._id
    );

    res.status(200).json({
      success: true,
      data: updatedSummary
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
