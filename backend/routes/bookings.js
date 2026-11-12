const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const Setting = require('../models/Setting');
const UserSubscription = require('../models/UserSubscription');
const {
  sendBookingConfirmationEmails,
  sendBookingStatusUpdateEmail,
  sendSevenDayFollowUpEmail
} = require('../services/emailService');
const {
  ensureBookingCalendarAndMeet,
  updateBookingCalendarEvent,
  cancelBookingCalendarEvent
} = require('../services/googleMeetService');
const { generateSessionSummaryForBooking } = require('../services/sessionSummaryService');
const {
  getPaymentSettings,
  evaluateUserFreeSessionEligibility,
  validateAndComputeCoupon,
  recordCouponRedemption
} = require('../services/couponService');
const {
  STANDARD_TIME_SLOTS,
  acquireAtomicSlotLock,
  bindAndConfirmSlotLock,
  releaseSlotLock,
  getAvailableSlotsForDate
} = require('../services/slotLockService');
const { protectAdmin, optionalAuth } = require('../middleware/auth');
const { publicFormLimiter, computeDedupFingerprint } = require('../middleware/security');

// GET /api/bookings/available-slots - Live time-slot availability for a date (prevents clashes)
router.get('/available-slots', optionalAuth, async (req, res) => {
  try {
    const { date, excludeBookingId } = req.query;
    if (!date) {
      return res.status(200).json({
        success: true,
        data: {
          date: null,
          timezone: 'Asia/Kolkata',
          standardSlots: STANDARD_TIME_SLOTS,
          slots: STANDARD_TIME_SLOTS.map((slot) => ({
            slot,
            available: true,
            reason: 'available'
          }))
        }
      });
    }

    const availability = await getAvailableSlotsForDate(date, excludeBookingId || null);
    res.set('Cache-Control', 'private, max-age=5, stale-while-revalidate=30');
    return res.status(200).json({
      success: true,
      data: {
        ...availability,
        standardSlots: STANDARD_TIME_SLOTS
      }
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Failed to check available time slots'
    });
  }
});

// POST /api/bookings - Create booking (Complimentary Introductory Session, 100% Coupon Waiver, OR Admin Manual Entry)
router.post('/', publicFormLimiter, optionalAuth, async (req, res, next) => {
  let acquiredLock = null;
  let claimedFreeSessionForUserId = null;
  try {
    const isAdminManual = Boolean(req.admin);
    const user = req.user || null;
    let appliedCouponInfo = null;
    let settings = null;

    // 1. If NOT an Admin manual entry, require authenticated & onboarded user + check free session / coupon eligibility
    if (!isAdminManual) {
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Please sign in with Google or Email first to book a mentoring session.'
        });
      }
      if (!user.onboardingCompleted) {
        return res.status(400).json({
          success: false,
          error: 'Please complete your one-time post-login profile setup before booking.'
        });
      }

      settings = await getPaymentSettings();
      const rawCouponCode = req.body.couponCode ? String(req.body.couponCode).trim() : '';

      if (rawCouponCode) {
        appliedCouponInfo = await validateAndComputeCoupon({
          code: rawCouponCode,
          user,
          planCode: 'SINGLE_SESSION',
          baseAmount: settings.sessionFee
        });
        if (!appliedCouponInfo.isFreeWithCoupon) {
          return res.status(402).json({
            success: false,
            error: `Coupon "${appliedCouponInfo.code}" reduces the fee to ₹${appliedCouponInfo.finalAmount}. Please proceed through online payment to complete booking.`
          });
        }
      } else {
        const eligibility = await evaluateUserFreeSessionEligibility(user, settings);
        if (!eligibility.canBookFree) {
          return res.status(402).json({
            success: false,
            error: eligibility.reason
          });
        }
      }
    }

    const resolvedName = String(user?.name || req.body.name || '').trim();
    const resolvedPhone = String(user?.phone || req.body.phone || '').trim();
    const resolvedUserType = user?.userType || req.body.userType || 'student';

    if (!resolvedName || !resolvedPhone) {
      return res.status(400).json({
        success: false,
        error: 'Name and phone/WhatsApp number are required.'
      });
    }

    const parsedAge = user?.age || (req.body.age ? Number(req.body.age) : undefined);
    const isUnder18 = Boolean(user?.isUnder18 ?? (resolvedUserType === 'student' && parsedAge && parsedAge < 18));

    if (!isAdminManual && isUnder18) {
      const pName = user?.parentName || req.body.parentName;
      const pPhone = user?.parentPhone || req.body.parentPhone;
      const pConsent = user?.parentConsentConfirmed || req.body.parentConsentConfirmed;
      if (!pName || !pPhone || !pConsent) {
        return res.status(400).json({
          success: false,
          error: 'For students under 18, parent/guardian name, phone number, and consent confirmation are required.'
        });
      }
    }

    // Require preferredDate and preferredTime for student bookings so no two sessions can clash
    if (!isAdminManual && (!req.body.preferredDate || !req.body.preferredTime)) {
      return res.status(400).json({
        success: false,
        error: 'Please select both a Preferred Date and an available Time Slot for your session.'
      });
    }

    // Deduplicate rapid double-clicks within 2 minutes for non-admin submissions
    const topicText = String(req.body.topic || req.body.concern || '').trim();
    const dedupKey = req.body.idempotencyKey
      ? String(req.body.idempotencyKey).trim()
      : computeDedupFingerprint([user?._id || resolvedPhone, topicText, req.body.preferredDate, req.body.preferredTime]);

    if (!isAdminManual) {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const duplicateBooking = await Booking.findOne({
        idempotencyKey: dedupKey,
        createdAt: { $gte: twoMinutesAgo }
      });
      if (duplicateBooking) {
        return res.status(200).json({
          success: true,
          duplicatePrevented: true,
          data: duplicateBooking
        });
      }
    }

    // 2. Atomically claim 1st complimentary session flag BEFORE acquiring slot lock or creating booking (prevents multi-tab free-session exploit)
    if (!isAdminManual && !appliedCouponInfo && user && settings && settings.limitOneFreeSessionPerUser) {
      const atomicClaim = await User.findOneAndUpdate(
        { _id: user._id, hasUsedFreeSession: { $ne: true } },
        { $set: { hasUsedFreeSession: true } },
        { new: true }
      );
      if (!atomicClaim) {
        return res.status(402).json({
          success: false,
          error:
            'You have already completed or booked your 1 complimentary introductory session. From Session #2 onwards, please pay the session fee, use a subscription credit, or apply an admin coupon code.'
        });
      }
      claimedFreeSessionForUserId = user._id;
    }

    // 3. Atomically validate & lock the requested date + time slot (prevents double-booking & simultaneous race conditions)
    let slotWindow = null;
    if (req.body.preferredDate && req.body.preferredTime) {
      const slotReservation = await acquireAtomicSlotLock({
        preferredDate: req.body.preferredDate,
        preferredTime: req.body.preferredTime,
        duration: 45,
        userId: user ? user._id : null,
        status: 'confirmed',
        isAdmin: isAdminManual
      });
      acquiredLock = slotReservation.lock;
      slotWindow = slotReservation.slotWindow;
    }

    const prevCount = user
      ? await Booking.countDocuments({ userId: user._id, status: { $ne: 'cancelled' } })
      : 0;

    // Strictly construct whitelisted booking document (Prevents Mass Assignment)
    const bookingPayload = {
      userId: user ? user._id : null,
      sessionNumber: prevCount + 1,
      bookingMode: isAdminManual
        ? 'admin_manual'
        : appliedCouponInfo
        ? 'coupon_waiver'
        : 'free_intro',
      idempotencyKey: dedupKey,
      name: resolvedName,
      email: String(user?.email || req.body.email || '').trim().toLowerCase(),
      phone: resolvedPhone,
      whatsapp: String(user?.whatsapp || req.body.whatsapp || resolvedPhone).trim(),
      userType: ['student', 'parent', 'institution', 'other'].includes(resolvedUserType)
        ? resolvedUserType
        : 'student',
      age: parsedAge,
      ageGroup: user?.ageGroup || req.body.ageGroup || 'other',
      isUnder18,
      parentName: user?.parentName || req.body.parentName || '',
      parentPhone: user?.parentPhone || req.body.parentPhone || '',
      parentEmail: user?.parentEmail || req.body.parentEmail || '',
      parentConsentConfirmed: Boolean(user?.parentConsentConfirmed ?? req.body.parentConsentConfirmed),
      whereCurrently: user?.whereCurrently || req.body.whereCurrently || req.body.currentStage || '',
      currentStage: user?.whereCurrently || req.body.whereCurrently || req.body.currentStage || '',
      institutionOrOrg: user?.institutionOrOrg || req.body.institutionOrOrg || '',
      city: user?.city || req.body.city || '',
      topic: topicText.slice(0, 1000),
      concern: topicText.slice(0, 1000),
      usefulGoal: req.body.usefulGoal ? String(req.body.usefulGoal).trim().slice(0, 500) : '',
      preferredDate: req.body.preferredDate || undefined,
      preferredTime: req.body.preferredTime ? String(req.body.preferredTime).trim() : undefined,
      scheduledStartAt: slotWindow ? slotWindow.startDate : null,
      scheduledEndAt: slotWindow ? slotWindow.endDate : null,
      source: user?.source || req.body.source || '',
      referredBy: user?.referredBy || req.body.referredBy || '',
      aiNotesConsent: Boolean(req.body.aiNotesConsent),
      aiNotesConsentAt: req.body.aiNotesConsent ? new Date() : null,

      // Privileged fields ONLY allowed if req.admin is authenticated
      status: isAdminManual && req.body.status ? req.body.status : 'confirmed',
      paymentRequired: isAdminManual ? Boolean(req.body.paymentRequired) : false,
      paymentStatus: isAdminManual && req.body.paymentStatus ? req.body.paymentStatus : 'not_required',
      paymentAmount: isAdminManual ? Number(req.body.paymentAmount || 0) : 0,
      couponCode: appliedCouponInfo ? appliedCouponInfo.code : null,
      discountAmount: appliedCouponInfo ? appliedCouponInfo.discountAmount : 0,
      paymentMode: isAdminManual
        ? req.body.paymentMode || 'DIRECT_UPI'
        : appliedCouponInfo
        ? `COUPON (${appliedCouponInfo.code})`
        : 'COMPLIMENTARY_INTRO',
      paymentTime: isAdminManual ? req.body.paymentTime || null : null,
      notes: isAdminManual ? req.body.notes || '' : ''
    };

    let booking = await Booking.create(bookingPayload);
    claimedFreeSessionForUserId = null; // Booking committed; keep hasUsedFreeSession = true
    if (acquiredLock) {
      await bindAndConfirmSlotLock({
        lockId: acquiredLock._id,
        bookingId: booking._id,
        status: booking.status === 'confirmed' ? 'confirmed' : 'pending_payment'
      });
    }

    if (user && !user.hasUsedFreeSession && bookingPayload.bookingMode === 'free_intro') {
      await User.updateOne({ _id: user._id }, { $set: { hasUsedFreeSession: true } });
    }
    if (appliedCouponInfo) {
      await recordCouponRedemption({
        couponCode: appliedCouponInfo.code,
        user,
        bookingId: booking._id
      });
    }

    // Generate Google Calendar event + unique Google Meet link BEFORE sending confirmation email
    if (booking.status === 'confirmed') {
      await ensureBookingCalendarAndMeet(booking);
      booking = await Booking.findById(booking._id);
    }

    const emailNotifications = await sendBookingConfirmationEmails(booking, {
      stage: booking.status === 'confirmed' ? 'confirmed' : 'created'
    });

    res.status(201).json({
      success: true,
      data: booking,
      emailNotifications: {
        userNotified: Boolean(emailNotifications.userEmail && emailNotifications.userEmail.sent),
        adminNotified: Boolean(emailNotifications.adminEmail && emailNotifications.adminEmail.sent)
      }
    });
  } catch (error) {
    if (claimedFreeSessionForUserId) {
      await User.updateOne({ _id: claimedFreeSessionForUserId }, { $set: { hasUsedFreeSession: false } }).catch(() => {});
    }
    if (acquiredLock) {
      await releaseSlotLock({ lockId: acquiredLock._id });
    }
    // CP Idempotency: If a concurrent request with the same (userId, idempotencyKey) already succeeded, return it
    if (error && error.code === 11000 && req.user && req.body) {
      const existing = await Booking.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      if (existing) {
        return res.status(200).json({
          success: true,
          duplicatePrevented: true,
          data: existing
        });
      }
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code || undefined,
        error: error.message
      });
    }
    next(error);
  }
});

// GET /api/bookings - Get all bookings (Admin Only!)
router.get('/', protectAdmin, async (req, res, next) => {
  try {
    const { status, userType, userId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (userType) query.userType = userType;
    if (userId) query.userId = userId;

    // Auto-provision Google Meet links for any confirmed bookings missing a meetingLink when Google Calendar is connected
    const { getGoogleIntegrationStatus } = require('../services/googleMeetService');
    const gStatus = await getGoogleIntegrationStatus().catch(() => null);
    if (gStatus?.connected) {
      const missingMeetBookings = await Booking.find({
        status: 'confirmed',
        $or: [{ meetingLink: null }, { meetingLink: '' }]
      })
        .sort({ createdAt: -1 })
        .limit(10);
      for (const mb of missingMeetBookings) {
        await ensureBookingCalendarAndMeet(mb).catch(() => null);
      }
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();

    // Group past sessions by userId or phone/email so Admin can see student's full session history
    const historyByKey = new Map();
    for (const b of bookings) {
      const key = b.userId
        ? `uid:${b.userId}`
        : b.email
        ? `email:${b.email.toLowerCase()}`
        : `phone:${String(b.phone || '').replace(/[^0-9]/g, '').slice(-10)}`;

      if (!historyByKey.has(key)) historyByKey.set(key, []);
      historyByKey.get(key).push({
        _id: b._id,
        sessionNumber: b.sessionNumber,
        topic: b.topic || b.concern,
        status: b.status,
        bookingMode: b.bookingMode,
        actionAgreed: b.actionAgreed,
        actionStatus: b.actionStatus,
        studentReflection: b.studentReflection,
        sharedNotes: b.sharedNotes,
        createdAt: b.createdAt,
        preferredDate: b.preferredDate
      });
    }

    const enrichedBookings = bookings.map((b) => {
      const key = b.userId
        ? `uid:${b.userId}`
        : b.email
        ? `email:${b.email.toLowerCase()}`
        : `phone:${String(b.phone || '').replace(/[^0-9]/g, '').slice(-10)}`;
      const allForParticipant = historyByKey.get(key) || [];
      return {
        ...b,
        participantTotalSessions: allForParticipant.length,
        participantHistory: allForParticipant.filter((h) => String(h._id) !== String(b._id))
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedBookings.length,
      data: enrichedBookings
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/:id - Get single booking (Admin Only)
router.get('/:id', protectAdmin, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/bookings/:id - Update booking lifecycle, mentor notes & status (Admin Only)
router.patch('/:id', protectAdmin, async (req, res, next) => {
  try {
    const existing = await Booking.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const allowedAdminUpdates = [
      'status',
      'notes',
      'sharedNotes',
      'followUpDate',
      'actionAgreed',
      'actionStatus',
      'studentReflection',
      'feedback',
      'paymentStatus',
      'paymentAmount',
      'paymentMode',
      'preferredDate',
      'preferredTime'
    ];

    const updates = {};
    for (const field of allowedAdminUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const slotChanged =
      (updates.preferredDate !== undefined &&
        String(updates.preferredDate || '') !== String(existing.preferredDate || '')) ||
      (updates.preferredTime !== undefined &&
        String(updates.preferredTime || '') !== String(existing.preferredTime || ''));

    const targetStatus = updates.status || existing.status;

    // If rescheduling to a new date/time and booking is not cancelled, verify no clash and move the atomic SlotLock
    if (slotChanged && targetStatus !== 'cancelled') {
      const nextDate = updates.preferredDate !== undefined ? updates.preferredDate : existing.preferredDate;
      const nextTime = updates.preferredTime !== undefined ? updates.preferredTime : existing.preferredTime;
      if (nextDate && nextTime) {
        const slotReservation = await acquireAtomicSlotLock({
          preferredDate: nextDate,
          preferredTime: nextTime,
          duration: existing.duration || 45,
          userId: existing.userId || null,
          bookingId: existing._id,
          excludeBookingId: existing._id,
          status: targetStatus === 'pending' ? 'pending_payment' : 'confirmed',
          isAdmin: true
        });
        updates.scheduledStartAt = slotReservation.slotWindow.startDate;
        updates.scheduledEndAt = slotReservation.slotWindow.endDate;
      }
    }

    // If booking is being cancelled, release its SlotLock immediately so another student can book the slot
    if (updates.status === 'cancelled' && existing.status !== 'cancelled') {
      await releaseSlotLock({ bookingId: existing._id });
    }

    // If a subscription-credit booking is being cancelled for the first time, automatically refund 1 credit to the student!
    if (
      updates.status === 'cancelled' &&
      existing.status !== 'cancelled' &&
      existing.bookingMode === 'subscription_credit' &&
      existing.userSubscriptionId
    ) {
      const sub = await UserSubscription.findById(existing.userSubscriptionId);
      if (sub) {
        sub.remainingCredits += 1;
        sub.usedCredits = Math.max(0, sub.usedCredits - 1);
        if (sub.status === 'exhausted' && (!sub.expiresAt || sub.expiresAt > new Date())) {
          sub.status = 'active';
        }
        sub.creditLedger.push({
          action: 'REFUNDED',
          bookingId: existing._id,
          creditsDelta: 1,
          balanceAfter: sub.remainingCredits,
          note: `Credit restored after Session #${existing.sessionNumber} was cancelled`,
          timestamp: new Date()
        });
        await sub.save();
      }
    }

    const statusOrSlotChanged =
      (updates.status !== undefined && updates.status !== existing.status) || slotChanged;

    const followUpNotesChanged =
      (updates.actionAgreed !== undefined &&
        String(updates.actionAgreed || '').trim() !== '' &&
        updates.actionAgreed !== existing.actionAgreed) ||
      (updates.sharedNotes !== undefined &&
        String(updates.sharedNotes || '').trim() !== '' &&
        updates.sharedNotes !== existing.sharedNotes);

    let booking = await Booking.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    // Synchronize Google Calendar & Meet event BEFORE sending update emails
    if (updates.status === 'cancelled' && existing.status !== 'cancelled') {
      await cancelBookingCalendarEvent(booking);
      booking = await Booking.findById(booking._id);
    } else if (booking.status === 'confirmed' && !booking.meetingLink) {
      await ensureBookingCalendarAndMeet(booking);
      booking = await Booking.findById(booking._id);
    } else if (slotChanged && booking.status !== 'cancelled') {
      await updateBookingCalendarEvent(booking);
      booking = await Booking.findById(booking._id);
    }

    // Automatically generate or refresh the 9-part structured post-session summary when session is completed or notes are updated
    if (
      booking.status === 'completed' &&
      (existing.status !== 'completed' ||
        updates.notes !== undefined ||
        updates.sharedNotes !== undefined ||
        updates.actionAgreed !== undefined ||
        updates.feedback !== undefined)
    ) {
      try {
        await generateSessionSummaryForBooking(booking._id);
        booking = await Booking.findById(booking._id);
      } catch (sumErr) {
        console.warn('[Bookings] Non-fatal session summary generation warning:', sumErr.message);
      }
    }

    if (statusOrSlotChanged) {
      await sendBookingStatusUpdateEmail(booking, 'admin_lifecycle_update');
    }
    if (followUpNotesChanged) {
      await sendSevenDayFollowUpEmail(booking);
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code || undefined,
        error: error.message
      });
    }
    next(error);
  }
});

module.exports = router;
