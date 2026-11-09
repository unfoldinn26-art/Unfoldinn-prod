const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { sendContactEmails } = require('../services/emailService');
const { protectAdmin } = require('../middleware/auth');
const { publicFormLimiter, honeypotMiddleware } = require('../middleware/security');
const { verifyCaptcha } = require('../middleware/captcha');

// POST /api/contact - Submit contact form (Public, Rate-Limited, Protected by reCAPTCHA & Honeypot)
router.post('/', publicFormLimiter, honeypotMiddleware(), verifyCaptcha, async (req, res, next) => {
  try {
    const { name, email, phone, subject, message, type } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, subject, and message are required.'
      });
    }

    const contact = await Contact.create({
      name: String(name).trim().slice(0, 120),
      email: String(email).trim().toLowerCase().slice(0, 120),
      phone: phone ? String(phone).trim().slice(0, 30) : '',
      subject: String(subject).trim().slice(0, 200),
      message: String(message).trim().slice(0, 2000),
      type: ['general', 'student', 'parent', 'other'].includes(type) ? type : 'general',
      status: 'new'
    });

    const emailNotifications = await sendContactEmails(contact);

    res.status(201).json({
      success: true,
      data: contact,
      emailNotifications: {
        userConfirmed: Boolean(emailNotifications.userEmail && emailNotifications.userEmail.sent),
        adminNotified: Boolean(emailNotifications.adminEmail && emailNotifications.adminEmail.sent)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/contact - Get all contacts (Admin Only)
router.get('/', protectAdmin, async (req, res, next) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/contact/:id - Update contact status (Admin Only)
router.patch('/:id', protectAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
