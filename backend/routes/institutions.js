const express = require('express');
const router = express.Router();
const InstitutionalEnquiry = require('../models/InstitutionalEnquiry');
const { sendInstitutionEnquiryEmails } = require('../services/emailService');
const { protectAdmin } = require('../middleware/auth');
const { publicFormLimiter } = require('../middleware/security');
const { verifyCaptcha } = require('../middleware/captcha');

// POST /api/institutions - Submit institutional enquiry (Public, Rate-Limited, Protected by reCAPTCHA)
router.post('/', publicFormLimiter, verifyCaptcha, async (req, res, next) => {
  try {
    const {
      institutionName,
      institutionType,
      contactPerson,
      designation,
      email,
      phone,
      city,
      state,
      studentStrength,
      enquiryNature,
      interestedIn,
      preferredContact
    } = req.body;

    if (!institutionName || !contactPerson || !email || !phone || !enquiryNature) {
      return res.status(400).json({
        success: false,
        error: 'institutionName, contactPerson, email, phone, and enquiryNature are required.'
      });
    }

    const enquiry = await InstitutionalEnquiry.create({
      institutionName: String(institutionName).trim().slice(0, 200),
      institutionType: ['school', 'college', 'university', 'other'].includes(institutionType)
        ? institutionType
        : 'college',
      contactPerson: String(contactPerson).trim().slice(0, 120),
      designation: designation ? String(designation).trim().slice(0, 120) : '',
      email: String(email).trim().toLowerCase().slice(0, 120),
      phone: String(phone).trim().slice(0, 30),
      city: city ? String(city).trim().slice(0, 100) : '',
      state: state ? String(state).trim().slice(0, 100) : '',
      studentStrength: studentStrength ? String(studentStrength).trim().slice(0, 80) : '',
      enquiryNature: String(enquiryNature).trim().slice(0, 2000),
      interestedIn: Array.isArray(interestedIn) ? interestedIn : [],
      preferredContact: ['email', 'phone', 'whatsapp'].includes(preferredContact)
        ? preferredContact
        : 'email',
      status: 'new'
    });

    const emailNotifications = await sendInstitutionEnquiryEmails(enquiry);

    res.status(201).json({
      success: true,
      data: enquiry,
      emailNotifications: {
        userConfirmed: Boolean(emailNotifications.userEmail && emailNotifications.userEmail.sent),
        adminNotified: Boolean(emailNotifications.adminEmail && emailNotifications.adminEmail.sent)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/institutions - Get all enquiries (Admin Only)
router.get('/', protectAdmin, async (req, res, next) => {
  try {
    const enquiries = await InstitutionalEnquiry.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: enquiries.length, data: enquiries });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/institutions/:id - Update enquiry status (Admin Only)
router.patch('/:id', protectAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    const enquiry = await InstitutionalEnquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!enquiry) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }
    res.status(200).json({ success: true, data: enquiry });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
