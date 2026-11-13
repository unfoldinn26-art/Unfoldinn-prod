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

export async function fetchAPI(endpoint, options = {}, _retryCount = 0) {
  const userToken = getUserToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
    ...options.headers
  };

  const method = (options.method || 'GET').toUpperCase();
  const isSafeToRetry =
    method === 'GET' || Boolean(headers['X-Idempotency-Key'] || headers['x-idempotency-key']);

  let res;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });
  } catch (networkErr) {
    if (_retryCount < 1 && isSafeToRetry) {
      await new Promise((r) => setTimeout(r, 1200));
      return fetchAPI(endpoint, options, _retryCount + 1);
    }
    throw new Error('Network connection error. Please check your internet connection and try again.');
  }

  // Automatically retry once on transient 502/503/504 serverless cold-start or DB reconnect blips
  if ([502, 503, 504].includes(res.status) && _retryCount < 1 && isSafeToRetry) {
    await new Promise((r) => setTimeout(r, 1200));
    return fetchAPI(endpoint, options, _retryCount + 1);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(
      data.error ||
        data.message ||
        (res.status === 503
          ? 'Service is warming up. Please try again in a moment.'
          : 'Something went wrong')
    );
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

export async function exportMyDpdpData() {
  return fetchAPI('/auth/dpdp/my-data');
}

export async function eraseMyDpdpAccount() {
  return fetchAPI('/auth/dpdp/erase-account', {
    method: 'DELETE'
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

// ============================================================================
// PLATFORM FEATURES: MESSAGES, NOTIFICATIONS, REVIEWS & MENTOR AVAILABILITY
// ============================================================================
export async function getMyMessageThreads() {
  return fetchAPI('/platform/messages/threads');
}

export async function startMessageThread({ subject, message }) {
  return fetchAPI('/platform/messages/threads', {
    method: 'POST',
    body: JSON.stringify({ subject, message })
  });
}

export async function sendMessageInThread(threadId, body) {
  return fetchAPI(`/platform/messages/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
}

export async function getMyNotifications() {
  return fetchAPI('/platform/notifications');
}

export async function markNotificationRead(id) {
  return fetchAPI(`/platform/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
  return fetchAPI('/platform/notifications/read-all', { method: 'POST' });
}

export async function getPublicReviews() {
  return fetchAPI('/platform/reviews');
}

export async function getMyReviews() {
  return fetchAPI('/platform/reviews/mine');
}

export async function submitSessionReview({ bookingId, rating, comment, isPublic = true }) {
  return fetchAPI('/platform/reviews', {
    method: 'POST',
    body: JSON.stringify({ bookingId, rating, comment, isPublic })
  });
}

export async function getMentorAvailabilityPublic() {
  return fetchAPI('/platform/mentor/availability');
}
