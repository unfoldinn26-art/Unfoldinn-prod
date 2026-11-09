const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const { sendSupportTicketEmails } = require('../services/emailService');
const { protectAdmin } = require('../middleware/auth');
const { publicFormLimiter, honeypotMiddleware } = require('../middleware/security');
const { verifyCaptcha } = require('../middleware/captcha');

// POST /api/support - Submit a website issue / support ticket (Public, Rate-Limited, Protected by reCAPTCHA & Honeypot)
router.post('/', publicFormLimiter, honeypotMiddleware(), verifyCaptcha, async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      category,
      pageUrl,
      subject,
      description,
      deviceInfo,
      priority
    } = req.body;

    if (!name || !email || !subject || !description) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, subject, and description are required.'
      });
    }

    const ticket = await SupportTicket.create({
      name: String(name).trim().slice(0, 120),
      email: String(email).trim().toLowerCase().slice(0, 120),
      phone: phone ? String(phone).trim().slice(0, 30) : '',
      category: category || 'bug_report',
      pageUrl: pageUrl ? String(pageUrl).trim().slice(0, 500) : '',
      subject: String(subject).trim().slice(0, 200),
      description: String(description).trim().slice(0, 3000),
      deviceInfo: deviceInfo ? String(deviceInfo).trim().slice(0, 500) : '',
      priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
      status: 'open'
    });

    const emailNotifications = await sendSupportTicketEmails(ticket);

    res.status(201).json({
      success: true,
      data: ticket,
      emailNotifications: {
        userConfirmed: Boolean(emailNotifications.userEmail && emailNotifications.userEmail.sent),
        adminNotified: Boolean(emailNotifications.adminEmail && emailNotifications.adminEmail.sent)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/support - Get all support tickets (Admin Only)
router.get('/', protectAdmin, async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;

    const tickets = await SupportTicket.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    next(error);
  }
});

// GET /api/support/:id - Get single support ticket (Admin Only)
router.get('/:id', protectAdmin, async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Support ticket not found' });
    }
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/support/:id - Update ticket status, priority, or admin notes (Admin Only)
router.patch('/:id', protectAdmin, async (req, res, next) => {
  try {
    const { status, priority, adminNotes } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Support ticket not found' });
    }
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/support/:id - Delete support ticket (Admin Only)
router.delete('/:id', protectAdmin, async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Support ticket not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
