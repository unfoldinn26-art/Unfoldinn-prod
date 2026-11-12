const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Linked User Account (for One-Time Google / Email Login & Session History)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    default: null
  },
  sessionNumber: {
    type: Number,
    default: 1
  },
  bookingMode: {
    type: String,
    enum: ['free_intro', 'single_paid', 'subscription_credit', 'support_contribution', 'admin_manual', 'coupon_waiver'],
    default: 'single_paid'
  },
  userSubscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription',
    default: null
  },
  planCode: {
    type: String,
    default: null
  },

  // 1. Your Name (Required)
  name: { type: String, required: true, trim: true },

  // 2. Your Age (Required for students; optional for parents)
  age: { type: Number, min: 10, max: 99 },
  ageGroup: { type: String, enum: ['16-18', '19-21', '22-25', 'parent', 'other'] },

  // Under-18 Safeguarding Fields (Triggered automatically if age < 18)
  isUnder18: { type: Boolean, default: false },
  parentName: { type: String, trim: true },
  parentPhone: { type: String, trim: true },
  parentEmail: { type: String, trim: true, lowercase: true },
  parentConsentConfirmed: { type: Boolean, default: false },

  // 3. Where are you currently?
  whereCurrently: {
    type: String,
    enum: ['School (Class 11–12)', 'College (UG)', 'Postgraduate', 'Working', 'Taking a gap / figuring things out', 'Other', '']
  },
  currentStage: { type: String },

  // 4. Name of your school / college / organisation
  institutionOrOrg: { type: String, trim: true },

  // 5. Which city are you in?
  city: { type: String, trim: true },

  // 6. What would you like to talk about?
  topic: { type: String, maxlength: 1000 },
  concern: { type: String, maxlength: 1000 }, // Backward compatibility alias

  // 7. What would make this conversation useful for you?
  usefulGoal: { type: String, maxlength: 500 },

  // 8. Your mobile / WhatsApp number (Required)
  phone: { type: String, required: true, trim: true, index: true },
  whatsapp: { type: String, trim: true },

  // 9. Your email address
  email: { type: String, trim: true, lowercase: true, index: true },

  // 10. How did you hear about Unfoldinn?
  source: { type: String, trim: true },

  // 11. Did someone suggest you speak with us?
  referredBy: { type: String, trim: true },

  // Additional scheduling & role fields
  userType: { type: String, enum: ['student', 'parent', 'institution', 'other'], required: true, default: 'student' },
  preferredDate: { type: Date },
  preferredTime: { type: String },
  duration: { type: Number, default: 45 }, // Session duration in minutes
  timezone: { type: String, default: 'Asia/Kolkata' },
  scheduledStartAt: { type: Date, default: null },
  scheduledEndAt: { type: Date, default: null },
  slotUpdateToken: { type: String, select: false },

  // Google Calendar & Google Meet Integration Fields
  meetingLink: { type: String, trim: true, default: null },
  calendarEventId: { type: String, trim: true, index: true, default: null },
  calendarHtmlLink: { type: String, trim: true, default: null },
  meetConferenceId: { type: String, trim: true, default: null },
  calendarEventStatus: {
    type: String,
    enum: ['not_created', 'pending', 'confirmed', 'cancelled', 'failed'],
    default: 'not_created'
  },
  calendarLastError: { type: String, default: null },

  // Participant Consent for AI-Assisted Session Notes & Summary
  aiNotesConsent: { type: Boolean, default: false },
  aiNotesConsentAt: { type: Date, default: null },

  // Post-Session Structured Summary Reference
  summaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SessionSummary',
    default: null
  },
  summaryStatus: {
    type: String,
    enum: ['none', 'pending', 'processing', 'ready', 'failed', 'reviewed'],
    default: 'none'
  },

  // 5-Stage Lifecycle & Admin Record-Keeping
  // Stages: 1. Intake -> 2. Conversation -> 3. Agreed Next Step -> 4. 7-Day Follow-Up -> 5. Outcome
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending', index: true },
  notes: { type: String }, // Private admin notes
  sharedNotes: { type: String }, // Mentor notes/summary shared with the student on their dashboard
  followUpDate: { type: Date }, // 7-day follow-up date
  actionAgreed: { type: String }, // Agreed next step (7-Day Action)
  actionStatus: { type: String, enum: ['pending', 'in-progress', 'completed', 'not-started', 'done'], default: 'not-started' },
  studentReflection: { type: String, maxlength: 1500 }, // Student's own progress update on the 7-Day Next Step
  feedback: { type: String }, // Outcome / review feedback

  // Cashfree Payment & Session Fee Fields
  paymentRequired: { type: Boolean, default: false },
  paymentStatus: {
    type: String,
    enum: ['not_required', 'pending', 'paid', 'failed', 'refunded', 'credit_redeemed'],
    default: 'not_required',
    index: true
  },
  paymentAmount: { type: Number, default: 0 },
  couponCode: { type: String, trim: true, uppercase: true, default: null },
  discountAmount: { type: Number, default: 0 },
  cashfreeOrderId: { type: String, trim: true, index: true },
  cashfreePaymentSessionId: { type: String, trim: true },
  cashfreePaymentId: { type: String, trim: true },
  orderHistory: [{ type: String }],
  idempotencyKey: { type: String, index: true },
  paymentMode: { type: String, trim: true },
  paymentTime: { type: Date }
}, { timestamps: true });

// CP Idempotency Guarantee: Prevents duplicate bookings with the same (userId, idempotencyKey) across concurrent serverless instances
bookingSchema.index(
  { userId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      userId: { $type: 'objectId' },
      idempotencyKey: { $type: 'string' }
    }
  }
);

// Fast range index for slot availability & overlap queries
bookingSchema.index({ status: 1, scheduledStartAt: 1, scheduledEndAt: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
