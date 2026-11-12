const mongoose = require('mongoose');

const emailOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    trim: true
  },
  purpose: {
    type: String,
    enum: ['register', 'login_2fa', 'email_verify'],
    default: 'email_verify'
  },
  pendingPasswordHash: {
    type: String,
    select: false,
    default: null
  },
  otpHash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastSentAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // MongoDB TTL index automatically deletes expired OTPs
  }
}, { timestamps: true });

module.exports = mongoose.model('EmailOtp', emailOtpSchema);
