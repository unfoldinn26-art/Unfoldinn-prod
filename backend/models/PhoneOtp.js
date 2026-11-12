const mongoose = require('mongoose');

const phoneOtpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  otpHash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  lastSentAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Auto-delete expired OTP documents via MongoDB TTL index
  }
}, { timestamps: true });

module.exports = mongoose.model('PhoneOtp', phoneOtpSchema);
