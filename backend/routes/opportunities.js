const express = require('express');
const router = express.Router();
const Opportunity = require('../models/Opportunity');
const { protectAdmin, optionalAdmin } = require('../middleware/auth');
const { escapeRegex } = require('../middleware/security');

// GET /api/opportunities/featured - Get featured opportunities (Public)
router.get('/featured', async (req, res, next) => {
  try {
    const opportunities = await Opportunity.find({ isActive: true, isFeatured: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: opportunities.length, data: opportunities });
  } catch (error) {
    next(error);
  }
});

// GET /api/opportunities - Get all active opportunities (or all if Admin)
router.get('/', optionalAdmin, async (req, res, next) => {
  try {
    const { category, locationMode, search, all, includeInactive } = req.query;
    const query = {};

    const isAdminRequest = Boolean(req.admin) && (all === 'true' || includeInactive === 'true');
    if (!isAdminRequest) {
      query.isActive = true;
    }

    if (category) query.category = category;
    if (locationMode) query.locationMode = locationMode;
    if (search) {
      query.name = { $regex: escapeRegex(String(search)), $options: 'i' };
    }

    const opportunities = await Opportunity.find(query).sort({ createdAt: -1 });
    if (!isAdminRequest) {
      res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    }
    res.status(200).json({ success: true, count: opportunities.length, data: opportunities });
  } catch (error) {
    next(error);
  }
});

// GET /api/opportunities/:id - Get single opportunity
router.get('/:id', optionalAdmin, async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity || (!opportunity.isActive && !req.admin)) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }
    res.status(200).json({ success: true, data: opportunity });
  } catch (error) {
    next(error);
  }
});

// POST /api/opportunities - Create opportunity (Admin Only)
router.post('/', protectAdmin, async (req, res, next) => {
  try {
    const opportunity = await Opportunity.create(req.body);
    res.status(201).json({ success: true, data: opportunity });
  } catch (error) {
    next(error);
  }
});

// PUT /api/opportunities/:id - Update opportunity (Admin Only)
router.put('/:id', protectAdmin, async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!opportunity) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }
    res.status(200).json({ success: true, data: opportunity });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/opportunities/:id - Soft delete (Admin Only)
router.delete('/:id', protectAdmin, async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!opportunity) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
