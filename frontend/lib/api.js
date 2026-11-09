const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getUserToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('si_user_token') : null;
}

export function setUserToken(token) {
  if (typeof window !== 'undefined' && token) {
    localStorage.setItem('si_user_token', token);
  }
}

export function removeUserToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('si_user_token');
  }
}

/**
 * Generate or reuse a deterministic idempotency key for a payment/booking action
 */
export function generateIdempotencyKey(prefix = 'si') {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return `${prefix}_${window.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function fetchAPI(endpoint, options = {}) {
  const userToken = getUserToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.error || data.message || 'Something went wrong');
    error.statusCode = res.status;
    throw error;
  }

  return data;
}

// ============================================================================
// USER AUTH, ONBOARDING & MENTEE SESSION HISTORY
// ============================================================================
export async function googleAuthLogin({ credential, accessToken }) {
  return fetchAPI('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential, accessToken })
  });
}

export async function directEmailLogin({ email, name }) {
  return fetchAPI('/auth/email/direct-login', {
    method: 'POST',
    body: JSON.stringify({ email, name })
  });
}

export async function sendEmailVerificationOtp({ email, name }) {
  return fetchAPI('/auth/email/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email, name })
  });
}

export async function verifyEmailVerificationOtp({ email, otp, name }) {
  return fetchAPI('/auth/email/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp, name })
  });
}

export async function sendPhoneOtp({ phone }) {
  return fetchAPI('/auth/phone/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone })
  });
}

export async function verifyPhoneOtp({ phone, otp }) {
  return fetchAPI('/auth/phone/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp })
  });
}

export async function registerUserAccount(data) {
  return fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function loginUserAccount(data) {
  return fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getCurrentUserProfile() {
  return fetchAPI('/auth/me');
}

export async function saveUserOnboarding(data) {
  return fetchAPI('/auth/onboarding', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function getMySessionsAndSubscriptions() {
  return fetchAPI('/auth/my-sessions');
}

export async function updateMySessionReflection(bookingId, data) {
  return fetchAPI(`/auth/my-sessions/${bookingId}/reflection`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

// ============================================================================
// SUBSCRIPTION PLANS & CREDIT BOOKING
// ============================================================================
export async function getSubscriptionPlans() {
  return fetchAPI('/subscriptions/plans');
}

export async function bookWithSubscriptionCredit(data, idempotencyKey) {
  const key = idempotencyKey || generateIdempotencyKey('credit_book');
  return fetchAPI('/subscriptions/book-with-credit', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': key },
    body: JSON.stringify({ ...data, idempotencyKey: key })
  });
}

// ============================================================================
// PUBLIC CONTENT & FORMS
// ============================================================================
export async function getOpportunities(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'all') params.append('category', filters.category);
  if (filters.locationMode) params.append('locationMode', filters.locationMode);
  if (filters.search) params.append('search', filters.search);
  const queryString = params.toString();
  return fetchAPI(`/opportunities${queryString ? `?${queryString}` : ''}`);
}

export async function getFeaturedOpportunities() {
  return fetchAPI('/opportunities/featured');
}

export async function getResources(category = '') {
  const params = category && category !== 'all' ? `?category=${category}` : '';
  return fetchAPI(`/resources${params}`);
}

export async function getResourceBySlug(slug) {
  return fetchAPI(`/resources/${slug}`);
}

export async function getTestimonials() {
  return fetchAPI('/testimonials');
}

export async function getFeaturedTestimonials() {
  return fetchAPI('/testimonials/featured');
}

export async function getAvailableBookingSlots(date, excludeBookingId = '') {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (excludeBookingId) params.set('excludeBookingId', excludeBookingId);
  const qs = params.toString();
  return fetchAPI(`/bookings/available-slots${qs ? `?${qs}` : ''}`);
}

export async function submitBooking(data, idempotencyKey) {
  const key = idempotencyKey || generateIdempotencyKey('free_book');
  return fetchAPI('/bookings', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': key },
    body: JSON.stringify({ ...data, idempotencyKey: key })
  });
}

export async function getPaymentConfig() {
  return fetchAPI('/payment/config');
}

export async function validateCouponCode(payload) {
  return fetchAPI('/payment/validate-coupon', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function createPaymentOrder(payload, idempotencyKey) {
  const key = idempotencyKey || payload?.idempotencyKey || generateIdempotencyKey('order');
  return fetchAPI('/payment/create-order', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': key },
    body: JSON.stringify({ ...payload, idempotencyKey: key })
  });
}

export async function verifyPaymentOrder(payload) {
  return fetchAPI('/payment/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function savePostPaymentSlotPreference(bookingId, payload) {
  return fetchAPI(`/payment/slot-preference/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function submitContact(data) {
  return fetchAPI('/contact', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function submitInstitutionalEnquiry(data) {
  return fetchAPI('/institutions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function subscribeNewsletter(data) {
  return fetchAPI('/newsletter', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function submitSupportTicket(data) {
  return fetchAPI('/support', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
