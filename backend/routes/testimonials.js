const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const { protectAdmin, optionalAdmin } = require('../middleware/auth');
const { publicFormLimiter, honeypotMiddleware } = require('../middleware/security');

// GET /api/testimonials/featured - Get featured testimonials (Public)
router.get('/featured', async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({ isApproved: true, isFeatured: true }).sort({ order: 1, createdAt: -1 });
    res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    res.status(200).json({ success: true, count: testimonials.length, data: testimonials });
  } catch (error) {
    next(error);
  }
});

// GET /api/testimonials - Get approved testimonials (or all if Admin passes all=true)
router.get('/', optionalAdmin, async (req, res, next) => {
  try {
    const { all } = req.query;
    const query = {};
    const isAdminRequest = Boolean(req.admin) && all === 'true';
    if (!isAdminRequest) {
      query.isApproved = true;
    }
    const testimonials = await Testimonial.find(query).sort({ order: 1, createdAt: -1 });
    if (!isAdminRequest) {
      res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    }
    res.status(200).json({ success: true, count: testimonials.length, data: testimonials });
  } catch (error) {
    next(error);
  }
});

// POST /api/testimonials - Submit testimonial (Public or Admin)
router.post('/', publicFormLimiter, honeypotMiddleware(), optionalAdmin, async (req, res, next) => {
  try {
    const { name, role, quote, isApproved, isFeatured, order } = req.body;
    if (!name || !quote) {
      return res.status(400).json({ success: false, error: 'Name and quote are required.' });
    }

    const payload = {
      name: String(name).trim().slice(0, 120),
      role: role ? String(role).trim().slice(0, 120) : '',
      quote: String(quote).trim().slice(0, 1000),
      // Only an authenticated Admin can immediately approve/feature on creation
      isApproved: req.admin ? Boolean(isApproved) : false,
      isFeatured: req.admin ? Boolean(isFeatured) : false,
      order: req.admin && order !== undefined ? Number(order) : 0
    };

    const testimonial = await Testimonial.create(payload);
    res.status(201).json({ success: true, data: testimonial });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/testimonials/:id - Update testimonial (Admin Only)
router.patch('/:id', protectAdmin, async (req, res, next) => {
  try {
    const { isApproved, isFeatured, order, name, role, quote } = req.body;
    const updateData = {};
    if (isApproved !== undefined) updateData.isApproved = isApproved;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (order !== undefined) updateData.order = order;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (quote) updateData.quote = quote;

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!testimonial) {
      return res.status(404).json({ success: false, error: 'Testimonial not found' });
    }
    res.status(200).json({ success: true, data: testimonial });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/testimonials/:id - Delete testimonial (Admin Only)
router.delete('/:id', protectAdmin, async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, error: 'Testimonial not found' });
    }
    res.status(200).json({ success: true, message: 'Testimonial deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
