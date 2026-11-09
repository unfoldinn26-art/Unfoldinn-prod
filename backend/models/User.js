const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    select: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  authProvider: {
    type: String,
    enum: ['google', 'email', 'both'],
    default: 'google'
  },

  // One-Time Post-Signup Onboarding Status & Profile Fields
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  onboardingCompletedAt: {
    type: Date
  },

  userType: {
    type: String,
    enum: ['student', 'parent', 'institution', 'other'],
    default: 'student'
  },
  phone: {
    type: String,
    trim: true,
    index: true
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerifiedAt: {
    type: Date
  },
  whatsapp: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: 10,
    max: 99
  },
  ageGroup: {
    type: String,
    enum: ['16-18', '19-21', '22-25', 'parent', 'other']
  },
  isUnder18: {
    type: Boolean,
    default: false
  },
  parentName: {
    type: String,
    trim: true
  },
  parentPhone: {
    type: String,
    trim: true
  },
  parentEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  parentRelation: {
    type: String,
    trim: true
  },
  parentConsentConfirmed: {
    type: Boolean,
    default: false
  },
  parentConsentAt: {
    type: Date
  },

  whereCurrently: {
    type: String,
    enum: ['School (Class 11–12)', 'College (UG)', 'Postgraduate', 'Working', 'Taking a gap / figuring things out', 'Other', '']
  },
  institutionOrOrg: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    trim: true
  },
  referredBy: {
    type: String,
    trim: true
  },

  // Session & Subscription Tracking
  hasUsedFreeSession: {
    type: Boolean,
    default: false
  },
  totalSessionsCompleted: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  },

  // Brute Force Lockout & Security
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  lastFailedLoginAt: {
    type: Date
  }
}, { timestamps: true });

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.setPassword = async function(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
