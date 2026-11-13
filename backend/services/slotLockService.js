const Booking = require('../models/Booking');
const SlotLock = require('../models/SlotLock');
const { prisma } = require('../config/prisma');
const {
  RedisKeys,
  acquireRedisSlotHold,
  releaseRedisSlotHold,
  delCache
} = require('../config/redis');
const { getDefaultMentorProfile } = require('./mentorService');

const PENDING_HOLD_MINUTES = 15;

const STANDARD_TIME_SLOTS = [
  '10:00 AM – 10:45 AM (Morning)',
  '11:00 AM – 11:45 AM (Late Morning)',
  '02:00 PM – 02:45 PM (Afternoon)',
  '03:30 PM – 04:15 PM (Late Afternoon)',
  '05:00 PM – 05:45 PM (Evening)',
  '06:15 PM – 07:00 PM (Evening)',
  '07:30 PM – 08:15 PM (Night)'
];

/**
 * Format any Date or YYYY-MM-DD string into YYYY-MM-DD in Asia/Kolkata (+05:30)
 */
function toIstDatePart(dateInput) {
  if (!dateInput) return null;
  const raw = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }
  const parsed = new Date(dateInput);
  if (isNaN(parsed.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(parsed);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return y && m && d ? `${y}-${m}-${d}` : null;
}

/**
 * Parse preferredTime string into { hours, minutes } in 24-hour IST
 */
function parseTimeSlotHoursMinutes(preferredTime) {
  const rawSlot = String(preferredTime || '').trim();
  if (!rawSlot) return null;

  // 1. First match explicit time with AM/PM or 24h HH:MM at the start of the slot label
  // e.g. "10:00 AM – 10:45 AM", "03:30 PM – 04:15 PM", "Morning (10:00 AM – 12:00 PM)"
  const explicitMatch = rawSlot.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (explicitMatch) {
    let h = Number(explicitMatch[1]);
    const m = Number(explicitMatch[2] || 0);
    const meridiem = explicitMatch[3].toLowerCase();
    if (meridiem === 'pm' && h < 12) h += 12;
    if (meridiem === 'am' && h === 12) h = 0;
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return { hours: h, minutes: m };
    }
  }

  // 2. Check 24-hour format like "14:30"
  const hhmmMatch = rawSlot.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (hhmmMatch) {
    return {
      hours: Number(hhmmMatch[1]),
      minutes: Number(hhmmMatch[2])
    };
  }

  // 3. Fallback to broad period keywords
  const lower = rawSlot.toLowerCase();
  if (lower.includes('morning')) return { hours: 10, minutes: 0 };
  if (lower.includes('afternoon')) return { hours: 14, minutes: 0 };
  if (lower.includes('evening')) return { hours: 17, minutes: 0 };
  if (lower.includes('night')) return { hours: 19, minutes: 30 };
  if (lower.includes('weekend')) return { hours: 11, minutes: 0 };

  return null;
}

/**
 * Compute exact session window & canonical slotKey ("YYYY-MM-DDTHH:MM") in IST (+05:30)
 */
function parseSlotWindow({ preferredDate, preferredTime, duration = 45, fallbackToTomorrow = false }) {
  const durationMinutes = Number(duration) > 0 ? Number(duration) : 45;
  let datePart = toIstDatePart(preferredDate);

  if (!datePart && fallbackToTomorrow) {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    datePart = toIstDatePart(tomorrow);
  }

  const timeParsed = parseTimeSlotHoursMinutes(preferredTime);
  if (!datePart || (!timeParsed && !fallbackToTomorrow)) {
    return null;
  }

  const hours = timeParsed ? timeParsed.hours : 17;
  const minutes = timeParsed ? timeParsed.minutes : 0;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');

  const slotKey = `${datePart}T${hh}:${mm}`;
  const startIso = `${datePart}T${hh}:${mm}:00+05:30`;
  const startDate = new Date(startIso);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  return {
    datePart,
    slotKey,
    hours,
    minutes,
    durationMinutes,
    startDate,
    endDate,
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
    timezone: 'Asia/Kolkata'
  };
}

/**
 * Find any active (confirmed or recent pending) booking that overlaps with [startDate, endDate]
 */
async function findConflictingBooking({ startDate, endDate, datePart, slotKey, excludeBookingId = null }) {
  const now = new Date();
  const pendingCutoff = new Date(now.getTime() - PENDING_HOLD_MINUTES * 60 * 1000);

  // Check active SlotLock first
  const lockQuery = {
    $and: [
      {
        $or: [
          { slotKey },
          { startAt: { $lt: endDate }, endAt: { $gt: startDate } }
        ]
      },
      {
        $or: [
          { status: 'confirmed' },
          { status: 'pending_payment', expiresAt: { $gt: now } }
        ]
      }
    ]
  };
  if (excludeBookingId) {
    lockQuery.$and.push({ bookingId: { $ne: excludeBookingId } });
  }

  const existingLock = await SlotLock.findOne(lockQuery).lean();
  if (existingLock) {
    // Verify the underlying booking isn't cancelled
    if (existingLock.bookingId) {
      const linkedBooking = await Booking.findById(existingLock.bookingId).select('status paymentStatus createdAt').lean();
      if (
        linkedBooking &&
        linkedBooking.status !== 'cancelled' &&
        (linkedBooking.status === 'confirmed' ||
          linkedBooking.status === 'completed' ||
          (linkedBooking.status === 'pending' && new Date(linkedBooking.createdAt) >= pendingCutoff))
      ) {
        return { source: 'slot_lock', conflict: existingLock };
      }
      // Clean up stale lock whose booking was cancelled or expired
      await SlotLock.deleteOne({ _id: existingLock._id }).catch(() => null);
    } else {
      return { source: 'slot_lock', conflict: existingLock };
    }
  }

  // Also check Bookings collection directly (covers legacy bookings created before SlotLock)
  const dayStart = new Date(`${datePart}T00:00:00+05:30`);
  const dayEnd = new Date(`${datePart}T23:59:59+05:30`);

  const candidateQuery = {
    status: { $ne: 'cancelled' },
    $or: [
      { scheduledStartAt: { $lt: endDate }, scheduledEndAt: { $gt: startDate } },
      { preferredDate: { $gte: dayStart, $lte: dayEnd } }
    ]
  };
  if (excludeBookingId) {
    candidateQuery._id = { $ne: excludeBookingId };
  }

  const candidates = await Booking.find(candidateQuery)
    .select('_id status paymentStatus preferredDate preferredTime duration scheduledStartAt scheduledEndAt createdAt')
    .lean();

  for (const b of candidates) {
    // Ignore unpaid pending bookings older than 15 minutes
    if (b.status === 'pending' && b.paymentStatus === 'pending' && new Date(b.createdAt) < pendingCutoff) {
      continue;
    }

    let bStart = b.scheduledStartAt ? new Date(b.scheduledStartAt) : null;
    let bEnd = b.scheduledEndAt ? new Date(b.scheduledEndAt) : null;

    if (!bStart || !bEnd) {
      const computed = parseSlotWindow({
        preferredDate: b.preferredDate,
        preferredTime: b.preferredTime,
        duration: b.duration || 45
      });
      if (computed) {
        bStart = computed.startDate;
        bEnd = computed.endDate;
      }
    }

    if (bStart && bEnd && bStart < endDate && bEnd > startDate) {
      return { source: 'booking', conflict: b };
    }
  }

  return null;
}

/**
 * Atomically validate and reserve a mentoring time slot using the Goldfish + Elephant 2-layer architecture:
 * Layer 1 (Goldfish - Redis Cloud): Fast SET NX EX 900 tokenized hold with Lua Compare-and-Delete (CAD).
 * Layer 2 (Elephant - Neon PostgreSQL + MongoDB): Authoritative @@unique([mentorProfileId, slotKey]) + btree_gist overlap exclusion.
 */
async function acquireAtomicSlotLock({
  preferredDate,
  preferredTime,
  duration = 45,
  mentorProfileId = null,
  userId = null,
  bookingId = null,
  userSubscriptionId = null,
  status = 'confirmed',
  excludeBookingId = null,
  isAdmin = false
}) {
  const slotWindow = parseSlotWindow({ preferredDate, preferredTime, duration });
  if (!slotWindow) {
    const err = new Error('Please select both a valid Preferred Date and Time Slot for your session.');
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  // Prevent students from booking a slot in the past (allow 5-minute grace buffer)
  if (!isAdmin && slotWindow.startDate.getTime() < now.getTime() - 5 * 60 * 1000) {
    const err = new Error(
      'The selected date and time slot has already passed. Please select an upcoming time slot.'
    );
    err.statusCode = 400;
    throw err;
  }

  // Resolve authoritative MentorProfile from Neon PostgreSQL
  const mentorProfile = mentorProfileId
    ? { id: mentorProfileId }
    : await getDefaultMentorProfile().catch(() => null);
  const resolvedMentorId = mentorProfile?.id || 'default-mentor';

  // 1. Check for any overlapping booking or active lock
  const conflictResult = await findConflictingBooking({
    startDate: slotWindow.startDate,
    endDate: slotWindow.endDate,
    datePart: slotWindow.datePart,
    slotKey: slotWindow.slotKey,
    excludeBookingId: excludeBookingId || bookingId
  });

  if (conflictResult) {
    const err = new Error(
      `The slot "${preferredTime}" on ${slotWindow.datePart} is already booked. Please select another available time slot.`
    );
    err.statusCode = 409;
    err.code = 'SLOT_ALREADY_BOOKED';
    throw err;
  }

  // 2. Clean up any expired pending_payment lock on this exact slotKey before atomic insert
  await SlotLock.deleteMany({
    slotKey: slotWindow.slotKey,
    status: 'pending_payment',
    expiresAt: { $lte: now }
  });

  if (mentorProfile?.id) {
    await prisma.slotLock
      .deleteMany({
        where: {
          mentorProfileId: mentorProfile.id,
          slotKey: slotWindow.slotKey,
          status: 'pending_payment',
          expiresAt: { lte: now }
        }
      })
      .catch(() => null);
  }

  // If rescheduling an existing booking, remove its previous lock first
  if (excludeBookingId || bookingId) {
    const targetId = excludeBookingId || bookingId;
    await SlotLock.deleteMany({ bookingId: targetId });
  }

  // 3. Layer 1 (Goldfish): Acquire fast tokenized Redis slot hold (15-min TTL)
  const redisHold = await acquireRedisSlotHold(
    resolvedMentorId,
    slotWindow.slotKey,
    PENDING_HOLD_MINUTES * 60
  );

  const expiresAt =
    status === 'pending_payment'
      ? new Date(now.getTime() + PENDING_HOLD_MINUTES * 60 * 1000)
      : null;

  // 4. Layer 2 (Elephant + Mirror): Atomic insert into Neon PostgreSQL (with btree_gist overlap exclusion) & MongoDB
  let pgLock = null;
  if (mentorProfile?.id) {
    try {
      pgLock = await prisma.slotLock.create({
        data: {
          mentorProfileId: mentorProfile.id,
          slotKey: slotWindow.slotKey,
          datePart: slotWindow.datePart,
          startAt: slotWindow.startDate,
          endAt: slotWindow.endDate,
          status,
          expiresAt
        }
      });
    } catch (pgErr) {
      // Release Redis hold via CAD if PostgreSQL unique/exclusion constraint rejected the slot
      await releaseRedisSlotHold(resolvedMentorId, slotWindow.slotKey, redisHold.lockToken).catch(() => null);
      if (
        pgErr.code === 'P2002' ||
        String(pgErr.message || '').includes('slot_locks_no_mentor_time_overlap') ||
        String(pgErr.message || '').includes('exclusion constraint')
      ) {
        const err = new Error(
          `This time slot (${preferredTime} on ${slotWindow.datePart}) was just booked by another student a moment ago. Please choose another available time slot.`
        );
        err.statusCode = 409;
        err.code = 'SLOT_RACE_CONFLICT';
        throw err;
      }
    }
  }

  try {
    const lockDoc = await SlotLock.create({
      slotKey: slotWindow.slotKey,
      datePart: slotWindow.datePart,
      startAt: slotWindow.startDate,
      endAt: slotWindow.endDate,
      bookingId: bookingId || null,
      userSubscriptionId: userSubscriptionId || null,
      userId: userId || null,
      status,
      expiresAt
    });

    lockDoc.lockToken = redisHold.lockToken;
    lockDoc.pgLockId = pgLock?.id || null;
    lockDoc.mentorProfileId = resolvedMentorId;

    await delCache(RedisKeys.slotsCache(resolvedMentorId, slotWindow.datePart)).catch(() => null);

    return {
      lock: lockDoc,
      slotWindow,
      lockToken: redisHold.lockToken,
      pgLockId: pgLock?.id || null,
      mentorProfileId: resolvedMentorId
    };
  } catch (dbErr) {
    // Roll back Neon PostgreSQL & Redis hold if secondary lock failed on race condition
    if (pgLock?.id) {
      await prisma.slotLock.delete({ where: { id: pgLock.id } }).catch(() => null);
    }
    await releaseRedisSlotHold(resolvedMentorId, slotWindow.slotKey, redisHold.lockToken).catch(() => null);

    if (dbErr && dbErr.code === 11000) {
      const err = new Error(
        `This time slot (${preferredTime} on ${slotWindow.datePart}) was just booked by another student a moment ago. Please choose another available time slot.`
      );
      err.statusCode = 409;
      err.code = 'SLOT_RACE_CONFLICT';
      throw err;
    }
    throw dbErr;
  }
}

/**
 * Attach bookingId to a newly acquired lock or promote a pending_payment lock to confirmed
 */
async function bindAndConfirmSlotLock({ lockId, bookingId, userSubscriptionId = null, status = 'confirmed' }) {
  if (!lockId && !bookingId) return null;
  const expiresAt =
    status === 'pending_payment'
      ? new Date(Date.now() + PENDING_HOLD_MINUTES * 60 * 1000)
      : null;

  if (lockId) {
    return SlotLock.findByIdAndUpdate(
      lockId,
      {
        $set: {
          ...(bookingId ? { bookingId } : {}),
          ...(userSubscriptionId ? { userSubscriptionId } : {}),
          status,
          expiresAt
        }
      },
      { new: true }
    );
  }

  return SlotLock.findOneAndUpdate(
    { bookingId },
    {
      $set: {
        status,
        expiresAt
      }
    },
    { new: true }
  );
}

/**
 * Release a slot lock when a booking is cancelled or payment fails
 * Uses Lua Compare-and-Delete (CAD) on Redis Cloud so an expired holder never deletes a newer holder's lock.
 */
async function releaseSlotLock({
  lockId = null,
  bookingId = null,
  userSubscriptionId = null,
  mentorProfileId = null,
  slotKey = null,
  lockToken = null
}) {
  const orConditions = [];
  if (lockId) orConditions.push({ _id: lockId });
  if (bookingId) orConditions.push({ bookingId });
  if (userSubscriptionId) orConditions.push({ userSubscriptionId });

  let existingLocks = [];
  if (orConditions.length > 0) {
    existingLocks = await SlotLock.find({ $or: orConditions }).lean().catch(() => []);
    await SlotLock.deleteMany({ $or: orConditions }).catch(() => null);
  }

  const mentorProfile = mentorProfileId
    ? { id: mentorProfileId }
    : await getDefaultMentorProfile().catch(() => null);
  const resolvedMentorId = mentorProfile?.id || 'default-mentor';

  const targetSlotKeys = new Set();
  if (slotKey) targetSlotKeys.add(slotKey);
  for (const l of existingLocks) {
    if (l.slotKey) targetSlotKeys.add(l.slotKey);
  }

  for (const sk of targetSlotKeys) {
    if (mentorProfile?.id) {
      const pgLocks = await prisma.slotLock
        .findMany({
          where: { mentorProfileId: mentorProfile.id, slotKey: sk }
        })
        .catch(() => []);
      for (const pl of pgLocks) {
        const tokenToRelease = lockToken || pl.lockToken;
        if (tokenToRelease) {
          await releaseRedisSlotHold(resolvedMentorId, sk, tokenToRelease).catch(() => null);
        }
        await prisma.slotLock.delete({ where: { id: pl.id } }).catch(() => null);
        await delCache(RedisKeys.slotsCache(resolvedMentorId, pl.datePart)).catch(() => null);
      }
    } else if (lockToken) {
      await releaseRedisSlotHold(resolvedMentorId, sk, lockToken).catch(() => null);
    }
  }
}

/**
 * Get live availability status for all standard time slots on a given date (YYYY-MM-DD).
 * Optimized to execute 2 parallel queries for the entire day instead of 14 sequential queries.
 */
async function getAvailableSlotsForDate(dateInput, excludeBookingId = null) {
  const datePart = toIstDatePart(dateInput);
  if (!datePart) {
    const err = new Error('Valid date (YYYY-MM-DD) is required');
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  const pendingCutoff = new Date(now.getTime() - PENDING_HOLD_MINUTES * 60 * 1000);
  const dayStart = new Date(`${datePart}T00:00:00+05:30`);
  const dayEnd = new Date(`${datePart}T23:59:59+05:30`);

  const lockQuery = {
    $and: [
      {
        $or: [
          { datePart },
          { startAt: { $lt: dayEnd }, endAt: { $gt: dayStart } }
        ]
      },
      {
        $or: [
          { status: 'confirmed' },
          { status: 'pending_payment', expiresAt: { $gt: now } }
        ]
      }
    ]
  };
  if (excludeBookingId) {
    lockQuery.$and.push({ bookingId: { $ne: excludeBookingId } });
  }

  const bookingQuery = {
    status: { $ne: 'cancelled' },
    $or: [
      { scheduledStartAt: { $lt: dayEnd }, scheduledEndAt: { $gt: dayStart } },
      { preferredDate: { $gte: dayStart, $lte: dayEnd } }
    ]
  };
  if (excludeBookingId) {
    bookingQuery._id = { $ne: excludeBookingId };
  }

  // Single parallel round-trip (2 queries total instead of 14 sequential queries)
  const [dayLocks, dayBookings] = await Promise.all([
    SlotLock.find(lockQuery).lean(),
    Booking.find(bookingQuery)
      .select('_id status paymentStatus preferredDate preferredTime duration scheduledStartAt scheduledEndAt createdAt')
      .lean()
  ]);

  // Pre-compute active booking windows for fast in-memory overlap evaluation
  const activeBookingById = new Map();
  const activeBookingWindows = [];

  for (const b of dayBookings) {
    if (b.status === 'pending' && b.paymentStatus === 'pending' && new Date(b.createdAt) < pendingCutoff) {
      continue;
    }

    activeBookingById.set(String(b._id), b);

    let bStart = b.scheduledStartAt ? new Date(b.scheduledStartAt) : null;
    let bEnd = b.scheduledEndAt ? new Date(b.scheduledEndAt) : null;

    if (!bStart || !bEnd) {
      const computed = parseSlotWindow({
        preferredDate: b.preferredDate,
        preferredTime: b.preferredTime,
        duration: b.duration || 45
      });
      if (computed) {
        bStart = computed.startDate;
        bEnd = computed.endDate;
      }
    }

    if (bStart && bEnd) {
      activeBookingWindows.push({ startDate: bStart, endDate: bEnd });
    }
  }

  // Filter out stale locks whose linked booking was cancelled or expired
  const validLocks = dayLocks.filter((lock) => {
    if (!lock.bookingId) return true;
    return activeBookingById.has(String(lock.bookingId));
  });

  const results = [];

  for (const slotLabel of STANDARD_TIME_SLOTS) {
    const windowInfo = parseSlotWindow({
      preferredDate: datePart,
      preferredTime: slotLabel,
      duration: 45
    });

    if (!windowInfo) continue;

    const isPast = windowInfo.startDate.getTime() < now.getTime() - 5 * 60 * 1000;
    if (isPast) {
      results.push({
        slot: slotLabel,
        slotKey: windowInfo.slotKey,
        startIso: windowInfo.startIso,
        endIso: windowInfo.endIso,
        available: false,
        reason: 'past'
      });
      continue;
    }

    const hasLockConflict = validLocks.some(
      (l) =>
        l.slotKey === windowInfo.slotKey ||
        (l.startAt && l.endAt && new Date(l.startAt) < windowInfo.endDate && new Date(l.endAt) > windowInfo.startDate)
    );

    const hasBookingConflict = activeBookingWindows.some(
      (bw) => bw.startDate < windowInfo.endDate && bw.endDate > windowInfo.startDate
    );

    const conflict = hasLockConflict || hasBookingConflict;

    results.push({
      slot: slotLabel,
      slotKey: windowInfo.slotKey,
      startIso: windowInfo.startIso,
      endIso: windowInfo.endIso,
      available: !conflict,
      reason: conflict ? 'booked' : 'available'
    });
  }

  return {
    date: datePart,
    timezone: 'Asia/Kolkata',
    slots: results
  };
}

module.exports = {
  STANDARD_TIME_SLOTS,
  toIstDatePart,
  parseTimeSlotHoursMinutes,
  parseSlotWindow,
  findConflictingBooking,
  acquireAtomicSlotLock,
  bindAndConfirmSlotLock,
  releaseSlotLock,
  getAvailableSlotsForDate
};
