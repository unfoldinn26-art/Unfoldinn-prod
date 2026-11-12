const express = require('express');
const router = express.Router();
const SubscriptionPlan = require('../models/SubscriptionPlan');
const UserSubscription = require('../models/UserSubscription');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
const { sendBookingConfirmationEmails } = require('../services/emailService');
const { ensureBookingCalendarAndMeet } = require('../services/googleMeetService');
const {
  acquireAtomicSlotLock,
  bindAndConfirmSlotLock,
  releaseSlotLock
} = require('../services/slotLockService');
const { protectUser, protectAdmin, optionalAdmin } = require('../middleware/auth');
const { computeDedupFingerprint } = require('../middleware/security');

const DEFAULT_PLANS = [
  {
    code: 'SINGLE_SESSION',
    name: 'Single Mentoring Conversation',
    subtitle: 'One focused 1-on-1 session',
    description: 'Ideal for a specific question, immediate decision check, or your first conversation with Deepak Sir.',
    planType: 'single',
    sessionsCount: 1,
    durationDays: 30,
    price: 500,
    originalPrice: 500,
    badgeText: 'Pay Per Session',
    features: [
      '1 × 30–45 min 1-on-1 mentoring conversation',
      'Personalized 7-Day Next Step action plan',
      'Recorded in your Mentee Dashboard',
      'Flexible date & time slot selection'
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 1
  },
  {
    code: 'MONTHLY_4',
    name: 'Monthly Mentorship Plan',
    subtitle: '4 Sessions / Month • Weekly Rhythm',
    description: 'Designed for continuous weekly clarity, 7-Day Next Step reviews, and steady progress without re-filling forms or paying each time.',
    planType: 'monthly_subscription',
    sessionsCount: 4,
    durationDays: 30,
    price: 1600,
    originalPrice: 2000,
    badgeText: 'Most Popular • Save 20%',
    features: [
      '4 × 1-on-1 mentoring sessions in 30 days (1/week rhythm)',
      '1-Click instant session booking with Subscription Credits',
      'Continuous 7-Day Next Step tracking & mentor notes',
      'Priority slot scheduling & WhatsApp check-ins'
    ],
    isPopular: true,
    isActive: true,
    sortOrder: 2
  },
  {
    code: 'QUARTERLY_8',
    name: 'Deep Transition Pack (90 Days)',
    subtitle: '8 Sessions / 3 Months • Complete Journey',
    description: 'Comprehensive mentorship through major college, career, higher-education, or life transitions over a 90-day horizon.',
    planType: 'multi_pack',
    sessionsCount: 8,
    durationDays: 90,
    price: 2800,
    originalPrice: 4000,
    badgeText: 'Best Value • Save 30%',
    features: [
      '8 × 1-on-1 mentoring sessions valid for 90 days',
      '1-Click instant booking anytime from your credit balance',
      'End-to-end career, confidence & opportunity roadmap',
      'Parent alignment conversation included if desired'
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 3
  }
];

async function ensureDefaultPlans() {
  const count = await SubscriptionPlan.countDocuments();
  if (count === 0) {
    // Check if admin set a custom single session fee
    const feeSetting = await Setting.findOne({ key: 'sessionFee' });
    const singleFee = feeSetting && Number(feeSetting.value) > 0 ? Number(feeSetting.value) : 500;

    const plansToInsert = DEFAULT_PLANS.map((p) => {
      if (p.code === 'SINGLE_SESSION') {
        return { ...p, price: singleFee, originalPrice: singleFee };
      }
      return p;
    });

    await SubscriptionPlan.insertMany(plansToInsert);
  }
}

// @route   GET /api/subscriptions/plans
// @desc    Get active subscription & session plans (or all if Admin)
// @access  Public (with optionalAdmin)
router.get('/plans', optionalAdmin, async (req, res, next) => {
  try {
    await ensureDefaultPlans();

    const query = {};
    if (!(req.admin && req.query.all === 'true')) {
      query.isActive = true;
    }

    const plans = await SubscriptionPlan.find(query).sort({ sortOrder: 1, createdAt: 1 });
    if (!req.admin) {
      res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    }
    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/subscriptions/book-with-credit
// @desc    Book a session instantaneously using 1 active Subscription Credit (Zero gateway checkout)
// @access  Private (User)
router.post('/book-with-credit', protectUser, async (req, res, next) => {
  let acquiredLock = null;
  try {
    const user = req.user;
    if (!user.onboardingCompleted || !user.phone) {
      return res.status(400).json({
        success: false,
        error: 'Please complete your one-time profile onboarding before booking.'
      });
    }

    const { topic, usefulGoal, preferredDate, preferredTime, idempotencyKey } = req.body;
    if (!topic || !String(topic).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please share in a line or two what you would like to focus on in this session.'
      });
    }
    if (!preferredDate || !preferredTime) {
      return res.status(400).json({
        success: false,
        error: 'Please select both a Preferred Date and an available Time Slot for your session.'
      });
    }

    // Check idempotency / rapid duplicate click within last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const dedupKey = idempotencyKey
      ? String(idempotencyKey).trim()
      : computeDedupFingerprint([user._id, topic, preferredDate, preferredTime]);

    const existingRecentBooking = await Booking.findOne({
      userId: user._id,
      idempotencyKey: dedupKey,
      createdAt: { $gte: twoMinutesAgo }
    });

    if (existingRecentBooking) {
      return res.status(200).json({
        success: true,
        duplicatePrevented: true,
        message: 'Session already confirmed!',
        data: existingRecentBooking
      });
    }

    const now = new Date();

    // Find earliest-expiring active subscription with remaining credits > 0
    const targetSub = await UserSubscription.findOne({
      userId: user._id,
      status: 'active',
      remainingCredits: { $gt: 0 },
      expiresAt: { $gt: now }
    }).sort({ expiresAt: 1 });

    if (!targetSub) {
      return res.status(400).json({
        success: false,
        error: 'You do not have any active session credits remaining. Please choose a Monthly Plan or Single Session.'
      });
    }

    // Atomically lock the requested time slot BEFORE deducting any credit (prevents double-booking & simultaneous race conditions)
    const slotReservation = await acquireAtomicSlotLock({
      preferredDate,
      preferredTime,
      duration: 45,
      userId: user._id,
      userSubscriptionId: targetSub._id,
      status: 'confirmed'
    });
    acquiredLock = slotReservation.lock;
    const slotWindow = slotReservation.slotWindow;

    // Atomically decrement 1 credit
    const updatedSub = await UserSubscription.findOneAndUpdate(
      {
        _id: targetSub._id,
        status: 'active',
        remainingCredits: { $gt: 0 },
        expiresAt: { $gt: now }
      },
      {
        $inc: { remainingCredits: -1, usedCredits: 1 }
      },
      { new: true }
    );

    if (!updatedSub) {
      await releaseSlotLock({ lockId: acquiredLock._id });
      acquiredLock = null;
      return res.status(409).json({
        success: false,
        error: 'Could not reserve session credit due to a concurrent request. Please refresh and try again.'
      });
    }

    // Compute student's chronological session number
    const previousSessionsCount = await Booking.countDocuments({
      userId: user._id,
      status: { $ne: 'cancelled' }
    });

    // Create the confirmed booking populated from user's saved profile
    let booking;
    try {
      booking = await Booking.create({
        userId: user._id,
        sessionNumber: previousSessionsCount + 1,
        bookingMode: 'subscription_credit',
        userSubscriptionId: updatedSub._id,
        planCode: updatedSub.planCode,
        idempotencyKey: dedupKey,

        // Auto-populated from User's 1-time onboarding profile
        name: user.name,
        email: user.email,
        phone: user.phone,
        whatsapp: user.whatsapp || user.phone,
        userType: user.userType || 'student',
        age: user.age,
        ageGroup: user.ageGroup,
        isUnder18: user.isUnder18,
        parentName: user.parentName,
        parentPhone: user.parentPhone,
        parentEmail: user.parentEmail,
        parentConsentConfirmed: user.parentConsentConfirmed,
        whereCurrently: user.whereCurrently,
        currentStage: user.whereCurrently,
        institutionOrOrg: user.institutionOrOrg,
        city: user.city,
        source: user.source || 'Returning Mentee (Subscription Credit)',
        referredBy: user.referredBy,

        // Session-specific fields
        topic: String(topic).trim().slice(0, 1000),
        concern: String(topic).trim().slice(0, 1000),
        usefulGoal: usefulGoal ? String(usefulGoal).trim().slice(0, 500) : '',
        preferredDate: preferredDate || undefined,
        preferredTime: preferredTime ? String(preferredTime).trim() : undefined,
        scheduledStartAt: slotWindow.startDate,
        scheduledEndAt: slotWindow.endDate,
        aiNotesConsent: Boolean(req.body.aiNotesConsent),
        aiNotesConsentAt: req.body.aiNotesConsent ? now : null,

        status: 'confirmed',
        paymentRequired: false,
        paymentStatus: 'credit_redeemed',
        paymentAmount: 0,
        paymentMode: `SUBSCRIPTION_CREDIT (${updatedSub.planCode})`,
        paymentTime: now
      });
    } catch (createErr) {
      // Rollback credit deduction & slot lock if booking creation fails for any reason
      if (acquiredLock) {
        await releaseSlotLock({ lockId: acquiredLock._id });
        acquiredLock = null;
      }
      await UserSubscription.findByIdAndUpdate(updatedSub._id, {
        $inc: { remainingCredits: 1, usedCredits: -1 }
      });
      throw createErr;
    }

    await bindAndConfirmSlotLock({
      lockId: acquiredLock._id,
      bookingId: booking._id,
      userSubscriptionId: updatedSub._id,
      status: 'confirmed'
    });

    // Record ledger entry and mark exhausted if 0 credits remain
    updatedSub.creditLedger.push({
      action: 'CONSUMED',
      bookingId: booking._id,
      creditsDelta: -1,
      balanceAfter: updatedSub.remainingCredits,
      note: `Booked Session #${booking.sessionNumber}: ${booking.topic.slice(0, 60)}`,
      timestamp: now
    });
    if (updatedSub.remainingCredits === 0) {
      updatedSub.status = 'exhausted';
    }
    await updatedSub.save();

    // Generate Google Calendar event + unique Google Meet link BEFORE sending confirmation email
    await ensureBookingCalendarAndMeet(booking);
    booking = await Booking.findById(booking._id);

    const emailNotifications = await sendBookingConfirmationEmails(booking, {
      stage: 'confirmed'
    });

    res.status(201).json({
      success: true,
      message: `Session #${booking.sessionNumber} confirmed using 1 credit from your ${updatedSub.planName}!`,
      data: booking,
      subscription: updatedSub,
      emailNotifications: {
        userNotified: Boolean(emailNotifications.userEmail && emailNotifications.userEmail.sent),
        adminNotified: Boolean(emailNotifications.adminEmail && emailNotifications.adminEmail.sent)
      }
    });
  } catch (error) {
    if (acquiredLock) {
      await releaseSlotLock({ lockId: acquiredLock._id });
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

// @route   PUT /api/subscriptions/plans/:id
// @desc    Update subscription plan pricing, sessions count, features or active state (Admin)
// @access  Private (Admin)
router.put('/plans/:id', protectAdmin, async (req, res, next) => {
  try {
    const allowedFields = [
      'name',
      'subtitle',
      'description',
      'sessionsCount',
      'durationDays',
      'price',
      'originalPrice',
      'badgeText',
      'features',
      'isPopular',
      'isActive',
      'sortOrder'
    ];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Subscription plan not found' });
    }

    // Keep legacy sessionFee Setting synced if SINGLE_SESSION price was updated
    if (plan.code === 'SINGLE_SESSION' && updates.price !== undefined) {
      await Setting.findOneAndUpdate(
        { key: 'sessionFee' },
        { value: Number(updates.price) },
        { upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/subscriptions/admin/all
// @desc    Get all user subscriptions & credit ledgers (Admin)
// @access  Private (Admin)
router.get('/admin/all', protectAdmin, async (req, res, next) => {
  try {
    const subscriptions = await UserSubscription.find()
      .populate('userId', 'name email phone city institutionOrOrg whereCurrently')
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  router,
  ensureDefaultPlans
};
