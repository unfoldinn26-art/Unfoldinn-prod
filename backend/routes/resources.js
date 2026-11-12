const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const { protectAdmin, optionalAdmin } = require('../middleware/auth');

// GET /api/resources - Get resources (supports category filter; all=true only for Admin)
router.get('/', optionalAdmin, async (req, res, next) => {
  try {
    const { category, all, includeUnpublished } = req.query;
    const query = {};

    const isAdminRequest = Boolean(req.admin) && (all === 'true' || includeUnpublished === 'true');
    if (!isAdminRequest) {
      query.isPublished = true;
    }

    if (category) query.category = category;

    const resources = await Resource.find(query).sort({ createdAt: -1 });
    if (!isAdminRequest) {
      res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    }
    res.status(200).json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    next(error);
  }
});

// GET /api/resources/id/:id - Get single resource by ID (Admin Only)
router.get('/id/:id', protectAdmin, async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    res.status(200).json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
});

// GET /api/resources/:slug - Get single resource by slug (Public)
router.get('/:slug', async (req, res, next) => {
  try {
    const resource = await Resource.findOne({ slug: req.params.slug, isPublished: true });
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    res.status(200).json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
});

// POST /api/resources - Create resource (Admin Only)
router.post('/', protectAdmin, async (req, res, next) => {
  try {
    const resource = await Resource.create(req.body);
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
});

// PUT /api/resources/:id - Update resource (Admin Only)
router.put('/:id', protectAdmin, async (req, res, next) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    res.status(200).json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/resources/:id - Delete resource (Admin Only)
router.delete('/:id', protectAdmin, async (req, res, next) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    res.status(200).json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
