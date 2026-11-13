const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { prisma, toApiResponse } = require('../config/prisma');
const { protectUser, protectAdmin } = require('../middleware/auth');
const { getAuthoritativeMentorProfile, invalidateMentorCache } = require('../services/mentorService');
const { recordAuditLog } = require('../services/auditAndConsentService');
const { runDisasterRecoveryBackup } = require('../scripts/drBackupWorker');

/**
 * Resolve or upsert the authoritative Neon PostgreSQL User for a MongoDB-authenticated req.user
 */
async function resolvePgUser(mongoUser) {
  if (!mongoUser || !mongoUser.email) return null;
  const email = String(mongoUser.email).trim().toLowerCase();
  return prisma.user.upsert({
    where: { email },
    update: {
      name: mongoUser.name || email.split('@')[0],
      phone: mongoUser.phone || ''
    },
    create: {
      email,
      name: mongoUser.name || email.split('@')[0],
      phone: mongoUser.phone || '',
      whatsapp: mongoUser.whatsapp || '',
      authProvider: mongoUser.authProvider || 'email',
      userType: ['student', 'parent', 'institution', 'mentor', 'other'].includes(mongoUser.userType)
        ? mongoUser.userType
        : 'student',
      onboardingCompleted: Boolean(mongoUser.onboardingCompleted),
      dpdpConsentConfirmed: Boolean(mongoUser.dpdpConsentConfirmed)
    }
  });
}

async function resolvePgAdmin(mongoAdmin) {
  if (!mongoAdmin || !mongoAdmin.email) return null;
  const email = String(mongoAdmin.email).trim().toLowerCase();
  return prisma.admin.upsert({
    where: { email },
    update: { name: mongoAdmin.name || 'Admin' },
    create: {
      email,
      name: mongoAdmin.name || 'Admin',
      passwordHash: mongoAdmin.password || 'external-auth',
      role: mongoAdmin.role === 'superadmin' ? 'superadmin' : 'admin'
    }
  });
}

function getClientIp(req) {
  return (
    (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0].trim()) ||
    req.ip ||
    'unknown'
  );
}

// ============================================================================
// 1. SESSION REVIEWS (Public approved + Mentee submission + Admin moderation)
// ============================================================================

router.get('/reviews', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { isApproved: true, isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: 24,
      include: {
        student: { select: { name: true, city: true, userType: true } },
        mentorProfile: { select: { displayName: true, slug: true } }
      }
    });
    res.status(200).json({ success: true, data: toApiResponse(reviews) });
  } catch (err) {
    next(err);
  }
});

router.get('/reviews/mine', protectUser, async (req, res, next) => {
  try {
    const pgUser = await resolvePgUser(req.user);
    const reviews = await prisma.review.findMany({
      where: { studentId: pgUser.id },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: toApiResponse(reviews) });
  } catch (err) {
    next(err);
  }
});

router.post('/reviews', protectUser, async (req, res, next) => {
  try {
    const pgUser = await resolvePgUser(req.user);
    const mentor = await getAuthoritativeMentorProfile();
    const { bookingId, rating, comment, isPublic = true } = req.body;

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5.' });
    }

    // Find or ensure a PostgreSQL booking reference for this review
    let pgBooking = null;
    if (bookingId) {
      pgBooking = await prisma.booking.findFirst({
        where: { id: String(bookingId), studentId: pgUser.id }
      });
    }
    if (!pgBooking) {
      pgBooking = await prisma.booking.findFirst({
        where: { studentId: pgUser.id },
        orderBy: { createdAt: 'desc' }
      });
    }
    if (!pgBooking) {
      // Create a verified review-anchor booking record if user's session predates PG migration
      pgBooking = await prisma.booking.create({
        data: {
          studentId: pgUser.id,
          mentorProfileId: mentor.id,
          name: pgUser.name,
          email: pgUser.email,
          phone: pgUser.phone || '0000000000',
          preferredDate: new Date(),
          preferredTime: '10:00 AM – 10:45 AM (Morning)',
          topic: 'Mentoring Session Feedback',
          status: 'completed',
          paymentStatus: 'not_required'
        }
      });
    }

    const cleanComment = comment ? String(comment).trim().slice(0, 1500) : '';
    const review = await prisma.review.upsert({
      where: { bookingId: pgBooking.id },
      update: {
        rating: numericRating,
        comment: cleanComment,
        isPublic: Boolean(isPublic),
        isApproved: false // Re-queue for admin moderation on edit
      },
      create: {
        bookingId: pgBooking.id,
        studentId: pgUser.id,
        mentorProfileId: mentor.id,
        rating: numericRating,
        comment: cleanComment,
        isPublic: Boolean(isPublic),
        isApproved: false
      }
    });

    await recordAuditLog({
      actorId: pgUser.id,
      actorRole: 'user',
      action: 'SESSION_REVIEW_SUBMITTED',
      entityType: 'Review',
      entityId: review.id,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been submitted for mentor review.',
      data: toApiResponse(review)
    });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/reviews', protectAdmin, async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { name: true, email: true } },
        mentorProfile: { select: { displayName: true } }
      }
    });
    res.status(200).json({ success: true, data: toApiResponse(reviews) });
  } catch (err) {
    next(err);
  }
});

router.patch('/admin/reviews/:id', protectAdmin, async (req, res, next) => {
  try {
    const pgAdmin = await resolvePgAdmin(req.admin);
    const { isApproved, isPublic } = req.body;
    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        ...(isApproved !== undefined ? { isApproved: Boolean(isApproved) } : {}),
        ...(isPublic !== undefined ? { isPublic: Boolean(isPublic) } : {})
      }
    });

    await recordAuditLog({
      actorId: pgAdmin?.id,
      actorRole: 'admin',
      action: 'ADMIN_REVIEW_MODERATED',
      entityType: 'Review',
      entityId: updated.id,
      afterState: { isApproved: updated.isApproved, isPublic: updated.isPublic },
      ip: getClientIp(req)
    });

    res.status(200).json({ success: true, data: toApiResponse(updated) });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 2. IN-APP MESSAGING (Student <-> Mentor Conversation Threads)
// ============================================================================

router.get('/messages/threads', protectUser, async (req, res, next) => {
  try {
    const pgUser = await resolvePgUser(req.user);
    const threads = await prisma.conversationThread.findMany({
      where: { studentId: pgUser.id },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        mentorProfile: { select: { displayName: true, headline: true } },
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });
    res.status(200).json({ success: true, data: toApiResponse(threads) });
  } catch (err) {
    next(err);
  }
});

router.post('/messages/threads', protectUser, async (req, res, next) => {
  try {
    const pgUser = await resolvePgUser(req.user);
    const mentor = await getAuthoritativeMentorProfile();
    const { subject, message } = req.body;

    const cleanSubject = String(subject || 'Mentoring Question for Deepak Sir').trim().slice(0, 140);
    const cleanBody = String(message || '').trim().slice(0, 2000);
    if (!cleanBody) {
      return res.status(400).json({ success: false, error: 'Please enter a message.' });
    }

    let thread = await prisma.conversationThread.findFirst({
      where: { studentId: pgUser.id, mentorProfileId: mentor.id, bookingId: null }
    });

    if (!thread) {
      thread = await prisma.conversationThread.create({
        data: {
          studentId: pgUser.id,
          mentorProfileId: mentor.id,
          subject: cleanSubject,
          lastMessageAt: new Date()
        }
      });
    }

    const msg = await prisma.conversationMessage.create({
      data: {
        threadId: thread.id,
        senderId: pgUser.id,
        senderRole: 'student',
        body: cleanBody
      }
    });

    await prisma.conversationThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() }
    });

    const fullThread = await prisma.conversationThread.findUnique({
      where: { id: thread.id },
      include: {
        mentorProfile: { select: { displayName: true, headline: true } },
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    res.status(201).json({ success: true, data: toApiResponse(fullThread), latestMessage: toApiResponse(msg) });
  } catch (err) {
    next(err);
  }
});

router.post('/messages/threads/:threadId/messages', protectUser, async (req, res, next) => {
  try {
    const pgUser = await resolvePgUser(req.user);
    const cleanBody = String(req.body.body || req.body.message || '').trim().slice(0, 2000);
    if (!cleanBody) {
      return res.status(400).json({ success: false, error: 'Message body cannot be empty.' });
    }

    const thread = await prisma.conversationThread.findFirst({
      where: { id: req.params.threadId, studentId: pgUser.id }
    });
    if (!thread) {
      return res.status(404).json({ success: false, error: 'Conversation thread not found.' });
    }

    const msg = await prisma.conversationMessage.create({
      data: {
        threadId: thread.id,
        senderId: pgUser.id,
        senderRole: 'student',
        body: cleanBody
      }
    });

    await prisma.conversationThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() }
    });

    res.status(201).json({ success: true, data: toApiResponse(msg) });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/threads', protectAdmin, async (req, res, next) => {
  try {
    const threads = await prisma.conversationThread.findMany({
      orderBy: { lastMessageAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, email: true, city: true } },
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });
    res.status(200).json({ success: true, data: toApiResponse(threads) });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/threads/:threadId/messages', protectAdmin, async (req, res, next) => {
  try {
    const mentor = await getAuthoritativeMentorProfile();
    const cleanBody = String(req.body.body || req.body.message || '').trim().slice(0, 2000);
    if (!cleanBody) {
      return res.status(400).json({ success: false, error: 'Reply cannot be empty.' });
    }

    const thread = await prisma.conversationThread.findUnique({
      where: { id: req.params.threadId }
    });
    if (!thread) {
      return res.status(404).json({ success: false, error: 'Conversation thread not found.' });
    }

    const msg = await prisma.conversationMessage.create({
      data: {
        threadId: thread.id,
        senderId: mentor.userId,
        senderRole: 'mentor',
        body: cleanBody
      }
    });

    await prisma.conversationThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() }
    });

    // Trigger in-app notification for the student
    await prisma.notification.create({
      data: {
        userId: thread.studentId,
        type: 'NEW_MENTOR_MESSAGE',
        title: 'New reply from Deepak Sir',
        body: cleanBody.slice(0, 140),
        actionUrl: '/dashboard?tab=messages'
      }
    });

    res.status(201).json({ success: true, data: toApiResponse(msg) });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 3. IN-APP NOTIFICATIONS
// ============================================================================

router.get('/notifications', protectUser, async (req, res, next) => {
  try {
    const pgUser = await resolvePgUser(req.user);
    const notifications = await prisma.notification.findMany({
      where: { userId: pgUser.id },
      orderBy: { createdAt: 'desc' },
      take: 30
    });
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    res.status(200).json({ success: true, unreadCount, data: toApiResponse(notifications) });
  } catch (err) {
    next(err);
  }
});

router.patch('/notifications/:id/read', protectUser, async (req, res, next) => {
  try {
    const pgUser = await resolvePgUser(req.user);
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: pgUser.id },
      data: { isRead: true, readAt: new Date() }
    });
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/notifications/read-all', protectUser, async (req, res, next) => {
  try {
    const pgUser = await resolvePgUser(req.user);
    await prisma.notification.updateMany({
      where: { userId: pgUser.id, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 4. MENTOR AVAILABILITY & TIME-OFF
// ============================================================================

router.get('/mentor/availability', async (req, res, next) => {
  try {
    const mentor = await getAuthoritativeMentorProfile();
    const [availabilities, timeOffs] = await Promise.all([
      prisma.mentorAvailability.findMany({
        where: { mentorProfileId: mentor.id },
        orderBy: { dayOfWeek: 'asc' }
      }),
      prisma.mentorTimeOff.findMany({
        where: { mentorProfileId: mentor.id, endAt: { gte: new Date() } },
        orderBy: { startAt: 'asc' }
      })
    ]);
    res.status(200).json({
      success: true,
      mentor: {
        id: mentor.id,
        displayName: mentor.displayName,
        timezone: mentor.timezone,
        isAcceptingBookings: mentor.isAcceptingBookings,
        standardSlots: mentor.standardSlots
      },
      availabilities: toApiResponse(availabilities),
      timeOffs: toApiResponse(timeOffs)
    });
  } catch (err) {
    next(err);
  }
});

router.put('/admin/mentor/availability', protectAdmin, async (req, res, next) => {
  try {
    const pgAdmin = await resolvePgAdmin(req.admin);
    const mentor = await getAuthoritativeMentorProfile();
    const { dayOfWeek, isActive, startTime, endTime, slotLabels, isAcceptingBookings } = req.body;

    if (isAcceptingBookings !== undefined) {
      await prisma.mentorProfile.update({
        where: { id: mentor.id },
        data: { isAcceptingBookings: Boolean(isAcceptingBookings) }
      });
    }

    if (dayOfWeek !== undefined) {
      const existing = await prisma.mentorAvailability.findFirst({
        where: { mentorProfileId: mentor.id, dayOfWeek: Number(dayOfWeek) }
      });
      if (existing) {
        await prisma.mentorAvailability.update({
          where: { id: existing.id },
          data: {
            ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
            ...(startTime ? { startTime: String(startTime) } : {}),
            ...(endTime ? { endTime: String(endTime) } : {}),
            ...(Array.isArray(slotLabels) ? { slotLabels } : {})
          }
        });
      }
    }

    await invalidateMentorCache(mentor.id, mentor.slug);
    await recordAuditLog({
      actorId: pgAdmin?.id,
      actorRole: 'admin',
      action: 'MENTOR_AVAILABILITY_UPDATED',
      entityType: 'MentorProfile',
      entityId: mentor.id,
      afterState: { dayOfWeek, isActive, isAcceptingBookings },
      ip: getClientIp(req)
    });

    res.status(200).json({ success: true, message: 'Mentor availability updated.' });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/mentor/time-off', protectAdmin, async (req, res, next) => {
  try {
    const pgAdmin = await resolvePgAdmin(req.admin);
    const mentor = await getAuthoritativeMentorProfile();
    const { startAt, endAt, reason } = req.body;

    if (!startAt || !endAt) {
      return res.status(400).json({ success: false, error: 'Start and end timestamps are required.' });
    }

    const timeOff = await prisma.mentorTimeOff.create({
      data: {
        mentorProfileId: mentor.id,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        reason: reason ? String(reason).slice(0, 200) : 'Mentor unavailable'
      }
    });

    await recordAuditLog({
      actorId: pgAdmin?.id,
      actorRole: 'admin',
      action: 'MENTOR_TIME_OFF_ADDED',
      entityType: 'MentorTimeOff',
      entityId: timeOff.id,
      ip: getClientIp(req)
    });

    res.status(201).json({ success: true, data: toApiResponse(timeOff) });
  } catch (err) {
    next(err);
  }
});

router.delete('/admin/mentor/time-off/:id', protectAdmin, async (req, res, next) => {
  try {
    await prisma.mentorTimeOff.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 5. ADMIN OPERATIONS: DR BACKUPS, AUDIT LOGS & REFUNDS
// ============================================================================

router.get('/admin/system-status', protectAdmin, async (req, res, next) => {
  try {
    const [backupRuns, auditLogs, refunds, paymentOrders] = await Promise.all([
      prisma.backupRun.findMany({ orderBy: { createdAt: 'desc' }, take: 15 }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 40 }),
      prisma.refund.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          paymentOrder: { select: { id: true, customerEmail: true, purpose: true, expectedAmount: true } }
        }
      }),
      prisma.paymentOrder.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          events: { orderBy: { createdAt: 'asc' } },
          transactions: { orderBy: { attemptNumber: 'asc' } }
        }
      })
    ]);

    res.status(200).json({
      success: true,
      backupRuns: toApiResponse(backupRuns),
      auditLogs: toApiResponse(auditLogs),
      refunds: toApiResponse(refunds),
      paymentOrders: toApiResponse(paymentOrders)
    });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/backups/run', protectAdmin, async (req, res, next) => {
  try {
    const pgAdmin = await resolvePgAdmin(req.admin);
    const verifiedRun = await runDisasterRecoveryBackup();

    await recordAuditLog({
      actorId: pgAdmin?.id,
      actorRole: 'admin',
      action: 'MANUAL_DR_BACKUP_TRIGGERED',
      entityType: 'BackupRun',
      entityId: verifiedRun.id,
      ip: getClientIp(req),
      metadata: { backupKey: verifiedRun.backupKey, sha256: verifiedRun.sha256Checksum }
    });

    res.status(201).json({
      success: true,
      message: 'Encrypted AES-256-GCM backup completed and restore-verified.',
      data: toApiResponse(verifiedRun)
    });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/refunds', protectAdmin, async (req, res, next) => {
  try {
    const pgAdmin = await resolvePgAdmin(req.admin);
    const { paymentOrderId, amount, reason, idempotencyKey } = req.body;

    if (!paymentOrderId || !amount || !reason) {
      return res.status(400).json({
        success: false,
        error: 'paymentOrderId, amount, and reason are required.'
      });
    }

    const idemKey = idempotencyKey || `refund_${paymentOrderId}_${crypto.randomUUID().slice(0, 8)}`;

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.refund.findUnique({ where: { idempotencyKey: idemKey } });
      if (existing) return existing;

      const order = await tx.paymentOrder.findUnique({
        where: { id: paymentOrderId },
        include: { transactions: { where: { status: 'SUCCESS' }, take: 1 } }
      });
      if (!order || !order.transactions.length) {
        const err = new Error('No successful payment transaction found for this PaymentOrder.');
        err.statusCode = 404;
        throw err;
      }

      const refund = await tx.refund.create({
        data: {
          idempotencyKey: idemKey,
          paymentOrderId: order.id,
          paymentTransactionId: order.transactions[0].id,
          amount: Number(amount).toFixed(2),
          reason: String(reason).slice(0, 300),
          status: 'PROCESSED',
          initiatedByAdminId: pgAdmin?.id || null,
          processedAt: new Date()
        }
      });

      const newRefundedTotal = Number(order.refundedAmount) + Number(amount);
      const nextStatus = newRefundedTotal >= Number(order.paidAmount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

      await tx.paymentOrder.update({
        where: { id: order.id },
        data: {
          refundedAmount: newRefundedTotal.toFixed(2),
          status: nextStatus
        }
      });

      await tx.paymentOrderEvent.create({
        data: {
          paymentOrderId: order.id,
          fromStatus: order.status,
          toStatus: nextStatus,
          actor: 'admin',
          reason: String(reason).slice(0, 300),
          metadata: { refundId: refund.id, amount: Number(amount) }
        }
      });

      return refund;
    });

    await recordAuditLog({
      actorId: pgAdmin?.id,
      actorRole: 'admin',
      action: 'ADMIN_REFUND_RECORDED',
      entityType: 'Refund',
      entityId: result.id,
      ip: getClientIp(req),
      metadata: { paymentOrderId, amount, reason }
    });

    res.status(201).json({ success: true, data: toApiResponse(result) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
