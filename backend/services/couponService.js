const Setting = require('../models/Setting');
const Coupon = require('../models/Coupon');
const Booking = require('../models/Booking');
const SubscriptionPlan = require('../models/SubscriptionPlan');

/**
 * Read payment, introductory complimentary session, and fee settings from MongoDB
 */
async function getPaymentSettings() {
  const [
    enabledDoc,
    feeDoc,
    firstFreeDoc,
    limitOneFreeDoc,
    noticeDoc
  ] = await Promise.all([
    Setting.findOne({ key: 'paymentsEnabled' }),
    Setting.findOne({ key: 'sessionFee' }),
    Setting.findOne({ key: 'firstSessionFreeEnabled' }),
    Setting.findOne({ key: 'limitOneFreeSessionPerUser' }),
    Setting.findOne({ key: 'feeNotice' })
  ]);

  const rawFee = feeDoc && Number(feeDoc.value) >= 0 ? Number(feeDoc.value) : 500;
  return {
    paymentsEnabled: enabledDoc ? Boolean(enabledDoc.value) : false,
    sessionFee: rawFee > 0 ? rawFee : 500,
    firstSessionFreeEnabled: firstFreeDoc ? Boolean(firstFreeDoc.value) : true,
    limitOneFreeSessionPerUser: limitOneFreeDoc ? Boolean(limitOneFreeDoc.value) : true,
    feeNotice: noticeDoc && typeof noticeDoc.value === 'string' ? noticeDoc.value : ''
  };
}

/**
 * Determine whether a user is eligible to book a ₹0 complimentary introductory session right now
 */
async function evaluateUserFreeSessionEligibility(user, preloadedSettings = null) {
  const settings = preloadedSettings || (await getPaymentSettings());

  let prevBookingsCount = 0;
  if (user && user._id) {
    prevBookingsCount = await Booking.countDocuments({
      userId: user._id,
      status: { $ne: 'cancelled' }
    });
  }

  const hasAlreadyBookedFirstSession = Boolean(user?.hasUsedFreeSession) || prevBookingsCount >= 1;

  // Case 1: User has NOT used their 1st session yet
  if (!hasAlreadyBookedFirstSession) {
    // Eligible for free intro if either global fees are OFF or 1st session free is ON
    const canBookFree = !settings.paymentsEnabled || settings.firstSessionFreeEnabled;
    return {
      canBookFree,
      hasAlreadyBookedFirstSession: false,
      prevBookingsCount,
      reason: canBookFree
        ? 'Eligible for 1st Complimentary Introductory Session'
        : 'Paid consultation fee is active for all sessions.'
    };
  }

  // Case 2: User HAS already booked their 1st session (Session #2+)
  if (settings.limitOneFreeSessionPerUser) {
    return {
      canBookFree: false,
      hasAlreadyBookedFirstSession: true,
      prevBookingsCount,
      reason:
        'You have already completed or booked your 1 complimentary introductory session. From Session #2 onwards, please pay the session fee, use a subscription credit, or apply an admin coupon code.'
    };
  }

  // Case 3: Admin explicitly turned OFF limitOneFreeSessionPerUser AND global paymentsEnabled is OFF
  const canBookFree = !settings.paymentsEnabled;
  return {
    canBookFree,
    hasAlreadyBookedFirstSession: true,
    prevBookingsCount,
    reason: canBookFree
      ? 'Complimentary mode enabled by Admin'
      : 'Online session payment, subscription credit, or coupon code is required.'
  };
}

/**
 * Validate a coupon code and calculate the exact discount for a given baseAmount & planCode
 */
async function validateAndComputeCoupon({ code, user, planCode = 'SINGLE_SESSION', baseAmount }) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) {
    const err = new Error('Please enter a coupon code.');
    err.statusCode = 400;
    throw err;
  }

  const coupon = await Coupon.findOne({ code: normalizedCode });
  if (!coupon || !coupon.isActive) {
    const err = new Error('Invalid or inactive coupon code.');
    err.statusCode = 404;
    throw err;
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) {
    const err = new Error('This coupon code has expired.');
    err.statusCode = 400;
    throw err;
  }

  if (coupon.maxUses && coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    const err = new Error('This coupon code has reached its maximum usage limit.');
    err.statusCode = 400;
    throw err;
  }

  if (user && coupon.maxUsesPerUser && coupon.maxUsesPerUser > 0) {
    const userUses = (coupon.usedBy || []).filter(
      (u) =>
        (u.userId && String(u.userId) === String(user._id)) ||
        (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase())
    ).length;

    if (userUses >= coupon.maxUsesPerUser) {
      const err = new Error('You have already used this coupon code the maximum number of times.');
      err.statusCode = 400;
      throw err;
    }
  }

  const isSubscriptionPlan = planCode && planCode !== 'SINGLE_SESSION';
  if (coupon.applicableTo === 'SINGLE_SESSION' && isSubscriptionPlan) {
    const err = new Error('This coupon is valid only for Single Mentoring Sessions.');
    err.statusCode = 400;
    throw err;
  }
  if (coupon.applicableTo === 'SUBSCRIPTION' && !isSubscriptionPlan) {
    const err = new Error('This coupon is valid only for Monthly / Multi-Session Subscription Plans.');
    err.statusCode = 400;
    throw err;
  }

  const originalAmount = Math.max(0, Number(baseAmount || 0));
  let discountAmount = 0;

  if (coupon.discountType === 'PERCENTAGE') {
    const pct = Math.min(100, Math.max(1, Number(coupon.discountValue || 0)));
    discountAmount = Math.round((originalAmount * pct) / 100);
  } else {
    discountAmount = Math.min(originalAmount, Math.max(0, Number(coupon.discountValue || 0)));
  }

  const finalAmount = Math.max(0, originalAmount - discountAmount);

  return {
    coupon,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    applicableTo: coupon.applicableTo,
    originalAmount,
    discountAmount,
    finalAmount,
    isFreeWithCoupon: finalAmount === 0
  };
}

/**
 * Record coupon redemption atomically (CP-safe against concurrent redemptions)
 */
async function recordCouponRedemption({ couponCode, user, orderId = null, bookingId = null }) {
  if (!couponCode) return null;
  const normalizedCode = String(couponCode).trim().toUpperCase();

  // Build atomic filter: avoid double-counting the same orderId or bookingId, and enforce maxUses if set
  const duplicateChecks = [];
  if (orderId) {
    duplicateChecks.push({ 'usedBy.orderId': orderId });
  }
  if (bookingId) {
    duplicateChecks.push({ 'usedBy.bookingId': bookingId });
  }

  const filter = {
    code: normalizedCode,
    ...(duplicateChecks.length > 0 ? { $nor: duplicateChecks } : {}),
    $or: [
      { maxUses: null },
      { maxUses: { $lte: 0 } },
      { $expr: { $lt: ['$usedCount', '$maxUses'] } }
    ]
  };

  const updated = await Coupon.findOneAndUpdate(
    filter,
    {
      $inc: { usedCount: 1 },
      $push: {
        usedBy: {
          userId: user?._id || null,
          email: user?.email || '',
          orderId: orderId || '',
          bookingId: bookingId || null,
          usedAt: new Date()
        }
      }
    },
    { new: true }
  );

  if (updated) return updated;
  return Coupon.findOne({ code: normalizedCode });
}

module.exports = {
  getPaymentSettings,
  evaluateUserFreeSessionEligibility,
  validateAndComputeCoupon,
  recordCouponRedemption
};
