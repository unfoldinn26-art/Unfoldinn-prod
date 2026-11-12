const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { sendNewsletterWelcomeEmail } = require('../services/emailService');
const { protectAdmin } = require('../middleware/auth');
const { publicFormLimiter, honeypotMiddleware } = require('../middleware/security');

// GET /api/newsletter - Get all subscribers (Admin Only)
router.get('/', protectAdmin, async (req, res, next) => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: subscribers.length, data: subscribers });
  } catch (error) {
    next(error);
  }
});

// POST /api/newsletter - Subscribe (Public, Rate-Limited & Honeypot-Protected)
router.post('/', publicFormLimiter, honeypotMiddleware(), async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    let subscriber = await Newsletter.findOne({ email: cleanEmail });

    if (subscriber) {
      if (!subscriber.isActive) {
        subscriber.isActive = true;
        if (name) subscriber.name = String(name).trim().slice(0, 120);
        await subscriber.save();
        return res.status(200).json({ success: true, message: 'Resubscribed successfully', data: subscriber });
      }
      return res.status(400).json({ success: false, error: 'Email is already subscribed' });
    }

    subscriber = await Newsletter.create({
      email: cleanEmail,
      name: name ? String(name).trim().slice(0, 120) : ''
    });

    const emailResult = await sendNewsletterWelcomeEmail(subscriber);

    res.status(201).json({
      success: true,
      data: subscriber,
      emailSent: Boolean(emailResult && emailResult.sent)
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/newsletter/:email - Unsubscribe
router.delete('/:email', publicFormLimiter, async (req, res, next) => {
  try {
    const subscriber = await Newsletter.findOneAndUpdate(
      { email: String(req.params.email).toLowerCase() },
      { isActive: false },
      { new: true }
    );
    if (!subscriber) {
      return res.status(404).json({ success: false, error: 'Subscriber not found' });
    }
    res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
