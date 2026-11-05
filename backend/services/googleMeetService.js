const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const GoogleIntegration = require('../models/GoogleIntegration');
const Booking = require('../models/Booking');

const INTEGRATION_KEY = 'primary_mentor_calendar';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const REQUIRED_SCOPES = [CALENDAR_SCOPE, 'openid', 'email', 'profile'];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getEncryptionKey() {
  const secret = process.env.JWT_SECRET || 'second_innings_fallback_key_do_not_use_in_prod';
  return crypto.scryptSync(secret, 'si_google_oauth_aes256_salt_v1', 32);
}

function encryptSecret(plaintext) {
  if (!plaintext) return null;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptSecret(payload) {
  if (!payload || typeof payload !== 'string') return null;
  const parts = payload.split(':');
  if (parts.length !== 3) return null;
  const [ivHex, tagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

function getGoogleOAuthConfig() {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const explicitRedirectUri = (process.env.GOOGLE_REDIRECT_URI || '').trim();
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .trim()
    .replace(/\/+$/, '');

  return {
    clientId,
    clientSecret,
    explicitRedirectUri,
    frontendUrl,
    isConfigured: Boolean(clientId && clientSecret)
  };
}

/**
 * Resolve the exact OAuth Redirect URI matching Google Cloud Console registration.
 * - Local dev: http://localhost:5000/api/admin/google/callback
 * - Production: https://www.unfoldinn.com/api/admin/google/callback (or GOOGLE_REDIRECT_URI if set)
 */
function resolveRedirectUri(req, customRedirectUri) {
  const config = getGoogleOAuthConfig();
  if (customRedirectUri && typeof customRedirectUri === 'string') {
    return customRedirectUri.trim();
  }
  if (config.explicitRedirectUri) {
    return config.explicitRedirectUri;
  }

  const host = req && req.headers ? String(req.headers.host || '') : '';
  const origin = req && req.headers ? String(req.headers.origin || req.headers.referer || '') : '';

  if (
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  ) {
    const port = process.env.PORT || 5000;
    return `http://localhost:${port}/api/admin/google/callback`;
  }

  return 'https://www.unfoldinn.com/api/admin/google/callback';
}

/**
 * Step 1: Generate CSRF-protected Google OAuth 2.0 Authorization URL (Admin Only)
 */
async function createAdminGoogleAuthUrl({ adminId, req, redirectUri: customRedirectUri }) {
  const config = getGoogleOAuthConfig();
  if (!config.isConfigured) {
    const err = new Error(
      'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured in the backend environment.'
    );
    err.statusCode = 400;
    throw err;
  }

  const redirectUri = resolveRedirectUri(req, customRedirectUri);
  const nonce = crypto.randomBytes(24).toString('hex');
  const nonceHash = crypto.createHash('sha256').update(nonce).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await GoogleIntegration.findOneAndUpdate(
    { key: INTEGRATION_KEY },
    {
      $set: {
        pendingOAuthStateHash: nonceHash,
        pendingOAuthStateExpiresAt: expiresAt,
        pendingOAuthRedirectUri: redirectUri
      }
    },
    { upsert: true, new: true }
  );

  const stateToken = jwt.sign(
    {
      purpose: 'google_calendar_oauth',
      adminId: String(adminId || ''),
      nonce,
      redirectUri
    },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: REQUIRED_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: stateToken
  });

  return {
    authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    redirectUri,
    scopes: REQUIRED_SCOPES
  };
}

/**
 * Step 2: Verify CSRF state, exchange authorization code server-side, and encrypt & persist tokens
 */
async function handleAdminGoogleCallback({ code, state }) {
  const config = getGoogleOAuthConfig();
  if (!config.isConfigured) {
    throw new Error('Google OAuth client credentials are not configured on the server.');
  }
  if (!code || !state) {
    throw new Error('Missing authorization code or OAuth state parameter.');
  }

  let decoded;
  try {
    decoded = jwt.verify(String(state), process.env.JWT_SECRET);
  } catch (jwtErr) {
    throw new Error('Invalid or expired OAuth state parameter (CSRF check failed).');
  }

  if (!decoded || decoded.purpose !== 'google_calendar_oauth' || !decoded.nonce) {
    throw new Error('Invalid OAuth state payload.');
  }

  const integration = await GoogleIntegration.findOne({ key: INTEGRATION_KEY }).select(
    '+pendingOAuthStateHash +refreshTokenEncrypted +accessTokenEncrypted'
  );

  if (
    !integration ||
    !integration.pendingOAuthStateHash ||
    !integration.pendingOAuthStateExpiresAt ||
    new Date() > new Date(integration.pendingOAuthStateExpiresAt)
  ) {
    throw new Error('OAuth session expired. Please initiate "Connect Google Calendar" again.');
  }

  const expectedHash = crypto.createHash('sha256').update(String(decoded.nonce)).digest('hex');
  const hashMatches = crypto.timingSafeEqual(
    Buffer.from(expectedHash, 'hex'),
    Buffer.from(integration.pendingOAuthStateHash, 'hex')
  );

  if (!hashMatches) {
    throw new Error('OAuth state mismatch detected. Request rejected.');
  }

  const redirectUri = decoded.redirectUri || integration.pendingOAuthRedirectUri;

  // Consume nonce immediately to prevent replay
  integration.pendingOAuthStateHash = null;
  integration.pendingOAuthStateExpiresAt = null;
  await integration.save();

  // Exchange authorization code for tokens
  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: String(code),
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }).toString()
  });

  const tokenData = await tokenResp.json();
  if (!tokenResp.ok || tokenData.error) {
    const errMsg =
      tokenData.error_description || tokenData.error || 'Failed to exchange Google OAuth code';
    integration.status = 'error';
    integration.lastError = errMsg;
    await integration.save();
    throw new Error(errMsg);
  }

  // Fetch connected user email/profile
  let connectedEmail = integration.connectedEmail || '';
  let connectedName = integration.connectedName || '';
  try {
    const userResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    if (userResp.ok) {
      const profile = await userResp.json();
      connectedEmail = (profile.email || connectedEmail || '').toLowerCase();
      connectedName = profile.name || connectedName || '';
    }
  } catch (_) {
    // Non-fatal if userinfo scope wasn't returned
  }

  if (tokenData.refresh_token) {
    integration.refreshTokenEncrypted = encryptSecret(tokenData.refresh_token);
  } else if (!integration.refreshTokenEncrypted && process.env.GOOGLE_REFRESH_TOKEN) {
    integration.refreshTokenEncrypted = encryptSecret(process.env.GOOGLE_REFRESH_TOKEN);
  }

  if (!integration.refreshTokenEncrypted) {
    integration.status = 'error';
    integration.lastError =
      'Google did not return a refresh_token. Please reconnect and approve offline access.';
    await integration.save();
    throw new Error(integration.lastError);
  }

  integration.accessTokenEncrypted = encryptSecret(tokenData.access_token);
  integration.tokenExpiryDate = new Date(
    Date.now() + Number(tokenData.expires_in || 3500) * 1000
  );
  integration.status = 'connected';
  integration.connectedEmail = connectedEmail;
  integration.connectedName = connectedName;
  integration.scopes = tokenData.scope ? String(tokenData.scope).split(' ') : REQUIRED_SCOPES;
  integration.connectedByAdminId = decoded.adminId || null;
  integration.connectedAt = new Date();
  integration.lastUsedAt = new Date();
  integration.lastError = null;

  await integration.save();

  return {
    connected: true,
    status: integration.status,
    connectedEmail: integration.connectedEmail,
    connectedName: integration.connectedName,
    calendarId: integration.calendarId,
    connectedAt: integration.connectedAt
  };
}

/**
 * Get current Google Calendar & Meet connection status (Safe for Admin UI — never exposes tokens)
 */
async function getGoogleIntegrationStatus() {
  const config = getGoogleOAuthConfig();
  const integration = await GoogleIntegration.findOne({ key: INTEGRATION_KEY }).select(
    '+refreshTokenEncrypted'
  );

  const hasRefreshToken = Boolean(
    (integration && integration.refreshTokenEncrypted) || process.env.GOOGLE_REFRESH_TOKEN
  );

  const isConnected =
    hasRefreshToken &&
    (!integration || integration.status === 'connected');

  return {
    oauthConfigured: config.isConfigured,
    connected: isConnected,
    status: integration ? integration.status : hasRefreshToken ? 'connected' : 'disconnected',
    connectedEmail:
      (integration && integration.connectedEmail) ||
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      '',
    connectedName: (integration && integration.connectedName) || '',
    calendarId: (integration && integration.calendarId) || 'primary',
    scopes: (integration && integration.scopes) || REQUIRED_SCOPES,
    connectedAt: (integration && integration.connectedAt) || null,
    lastUsedAt: (integration && integration.lastUsedAt) || null,
    lastError: (integration && integration.lastError) || null
  };
}

/**
 * Disconnect / Clear stored Google OAuth credentials (Admin Only)
 */
async function disconnectGoogleIntegration() {
  await GoogleIntegration.findOneAndUpdate(
    { key: INTEGRATION_KEY },
    {
      $set: {
        status: 'disconnected',
        refreshTokenEncrypted: null,
        accessTokenEncrypted: null,
        tokenExpiryDate: null,
        lastError: null
      }
    },
    { upsert: true }
  );
  return { connected: false, status: 'disconnected' };
}

/**
 * Retrieve a valid Google OAuth access token, refreshing automatically when needed.
 * Marks status as `revoked_or_expired` if Google rejects the refresh token (`invalid_grant`).
 */
async function getValidAccessToken() {
  const config = getGoogleOAuthConfig();
  if (!config.isConfigured) {
    return { accessToken: null, calendarId: 'primary', error: 'google_oauth_not_configured' };
  }

  let integration = await GoogleIntegration.findOne({ key: INTEGRATION_KEY }).select(
    '+refreshTokenEncrypted +accessTokenEncrypted'
  );

  // Return cached access token if still valid for > 2 minutes
  if (
    integration &&
    integration.status === 'connected' &&
    integration.accessTokenEncrypted &&
    integration.tokenExpiryDate &&
    new Date(integration.tokenExpiryDate).getTime() - Date.now() > 2 * 60 * 1000
  ) {
    const cachedToken = decryptSecret(integration.accessTokenEncrypted);
    if (cachedToken) {
      return {
        accessToken: cachedToken,
        calendarId: integration.calendarId || 'primary',
        connectedEmail: integration.connectedEmail,
        error: null
      };
    }
  }

  let refreshToken = null;
  if (integration && integration.refreshTokenEncrypted) {
    try {
      refreshToken = decryptSecret(integration.refreshTokenEncrypted);
    } catch (decErr) {
      console.error('[GoogleMeetService] Failed to decrypt refresh token:', decErr.message);
    }
  }
  if (!refreshToken && process.env.GOOGLE_REFRESH_TOKEN) {
    refreshToken = process.env.GOOGLE_REFRESH_TOKEN.trim();
  }

  if (!refreshToken) {
    return { accessToken: null, calendarId: 'primary', error: 'google_calendar_not_connected' };
  }

  try {
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }).toString()
    });

    const data = await resp.json();
    if (!resp.ok || data.error || !data.access_token) {
      const errCode = data.error || 'token_refresh_failed';
      const errDesc = data.error_description || data.error || 'Failed to refresh Google token';
      if (integration) {
        integration.status = errCode === 'invalid_grant' ? 'revoked_or_expired' : 'error';
        integration.lastError = errDesc;
        await integration.save();
      }
      console.error(`[GoogleMeetService] Token refresh error (${errCode}): ${errDesc}`);
      return { accessToken: null, calendarId: 'primary', error: errDesc };
    }

    if (!integration) {
      integration = new GoogleIntegration({
        key: INTEGRATION_KEY,
        status: 'connected',
        refreshTokenEncrypted: encryptSecret(refreshToken)
      });
    }

    integration.accessTokenEncrypted = encryptSecret(data.access_token);
    integration.tokenExpiryDate = new Date(
      Date.now() + Number(data.expires_in || 3500) * 1000
    );
    integration.status = 'connected';
    integration.lastUsedAt = new Date();
    integration.lastError = null;
    await integration.save();

    return {
      accessToken: data.access_token,
      calendarId: integration.calendarId || 'primary',
      connectedEmail: integration.connectedEmail,
      error: null
    };
  } catch (netErr) {
    console.error('[GoogleMeetService] Network error refreshing token:', netErr.message);
    return { accessToken: null, calendarId: 'primary', error: netErr.message };
  }
}

/**
 * Parse booking's preferredDate and preferredTime into exact start/end Date objects in Asia/Kolkata (+05:30)
 */
function computeSessionWindow(booking) {
  const durationMinutes = Number(booking.duration) > 0 ? Number(booking.duration) : 45;
  const timezone = booking.timezone || 'Asia/Kolkata';

  // Determine base YYYY-MM-DD in IST
  let datePart = null;
  if (booking.preferredDate) {
    const parsed = new Date(booking.preferredDate);
    if (!isNaN(parsed.getTime())) {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(parsed);
      const y = parts.find((p) => p.type === 'year')?.value;
      const m = parts.find((p) => p.type === 'month')?.value;
      const d = parts.find((p) => p.type === 'day')?.value;
      if (y && m && d) datePart = `${y}-${m}-${d}`;
    }
  }

  if (!datePart) {
    // Default to tomorrow in IST if no preferredDate was selected yet
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(tomorrow);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    datePart = `${y}-${m}-${d}`;
  }

  let hours = 17; // Default 5:00 PM IST
  let minutes = 0;
  const rawSlot = String(booking.preferredTime || '').trim();

  if (rawSlot) {
    const lower = rawSlot.toLowerCase();
    // 1. Match explicit time like "11:00 AM", "03:30 PM", "10:00 AM" FIRST
    const explicitAmPmMatch = rawSlot.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    const hhmmMatch = rawSlot.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (explicitAmPmMatch) {
      let h = Number(explicitAmPmMatch[1]);
      const m = Number(explicitAmPmMatch[2] || 0);
      const meridiem = explicitAmPmMatch[3].toLowerCase();
      if (meridiem === 'pm' && h < 12) h += 12;
      if (meridiem === 'am' && h === 12) h = 0;
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        hours = h;
        minutes = m;
      }
    } else if (hhmmMatch) {
      hours = Number(hhmmMatch[1]);
      minutes = Number(hhmmMatch[2]);
    } else if (lower.includes('morning')) {
      hours = 10;
      minutes = 0;
    } else if (lower.includes('afternoon')) {
      hours = 14;
      minutes = 0;
    } else if (lower.includes('evening')) {
      hours = 17;
      minutes = 0;
    } else if (lower.includes('night')) {
      hours = 19;
      minutes = 30;
    } else if (lower.includes('weekend')) {
      hours = 11;
      minutes = 0;
    }
  }

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const startIso = `${datePart}T${hh}:${mm}:00+05:30`;
  const startDate = new Date(startIso);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  return {
    startDate,
    endDate,
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
    timezone,
    durationMinutes
  };
}

function extractMeetDetailsFromEvent(eventData) {
  if (!eventData) return { meetUrl: null, conferenceId: null, statusCode: null };
  const conf = eventData.conferenceData;
  const statusCode = conf?.createRequest?.status?.statusCode || (eventData.hangoutLink ? 'success' : null);
  const videoEntry = Array.isArray(conf?.entryPoints)
    ? conf.entryPoints.find((e) => e.entryPointType === 'video' && e.uri)
    : null;
  const rawUrl = eventData.hangoutLink || (videoEntry && videoEntry.uri) || null;
  const isValidMeetUrl =
    typeof rawUrl === 'string' && /^https:\/\/meet\.google\.com\/[a-z0-9-]+/i.test(rawUrl.trim());

  return {
    meetUrl: isValidMeetUrl ? rawUrl.trim() : null,
    conferenceId: conf?.conferenceId || null,
    statusCode
  };
}

function buildCalendarEventPayload(booking, windowInfo, connectedEmail) {
  const bookingId = String(booking._id);
  const shortRef = `#${bookingId.slice(-6).toUpperCase()}`;
  const studentName = booking.name || 'Participant';
  const sessionNum = booking.sessionNumber || 1;

  const attendees = [];
  if (booking.email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(booking.email)) {
    const domain = booking.email.split('@')[1]?.toLowerCase();
    if (!['example.com', 'example.org', 'example.net', 'resend.dev'].includes(domain)) {
      attendees.push({
        email: booking.email.trim().toLowerCase(),
        displayName: studentName
      });
    }
  }
  if (
    booking.parentEmail &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(booking.parentEmail) &&
    booking.parentEmail.toLowerCase() !== (booking.email || '').toLowerCase()
  ) {
    attendees.push({
      email: booking.parentEmail.trim().toLowerCase(),
      displayName: booking.parentName || `Parent of ${studentName}`
    });
  }

  const adminEmail = (
    connectedEmail ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    'unfoldinn26@gmail.com'
  )
    .trim()
    .toLowerCase();
  if (adminEmail && !attendees.some((a) => a.email === adminEmail)) {
    attendees.push({
      email: adminEmail,
      displayName: 'Mr. Deepak Sogani (Unfoldinn)'
    });
  }

  const descriptionLines = [
    `Unfoldinn 1-on-1 Mentoring Session (${shortRef})`,
    `Mentor: Mr. Deepak Sogani`,
    `Participant: ${studentName} (Session #${sessionNum})`,
    booking.phone ? `Phone / WhatsApp: ${booking.phone}` : '',
    booking.topic ? `\nSession Focus / Topic:\n${booking.topic}` : '',
    booking.usefulGoal ? `\nDesired Outcome:\n${booking.usefulGoal}` : '',
    `\nBooking Reference: ${bookingId}`
  ].filter(Boolean);

  return {
    summary: `Unfoldinn 1-on-1: ${studentName} (Session #${sessionNum} • ${shortRef})`,
    description: descriptionLines.join('\n'),
    start: {
      dateTime: windowInfo.startIso,
      timeZone: windowInfo.timezone
    },
    end: {
      dateTime: windowInfo.endIso,
      timeZone: windowInfo.timezone
    },
    attendees,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 15 }
      ]
    },
    conferenceData: {
      createRequest: {
        requestId: `si-meet-${bookingId}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet'
        }
      }
    }
  };
}

/**
 * Create a unique Google Calendar event + Google Meet conference link for a confirmed booking.
 * - Safe against duplicate requests (returns existing event if already created).
 * - Polls if conferenceData creation is initially `pending`.
 * - Never claims a Meet link exists unless Google Calendar confirms a valid `https://meet.google.com/...` URL.
 */
async function ensureBookingCalendarAndMeet(bookingDocOrId) {
  const booking =
    typeof bookingDocOrId === 'string' || bookingDocOrId instanceof require('mongoose').Types.ObjectId
      ? await Booking.findById(bookingDocOrId)
      : bookingDocOrId;

  if (!booking) {
    return { created: false, reason: 'booking_not_found', meetingLink: null };
  }

  // 1. Idempotency check: if this booking already has a confirmed event & valid Meet link, return it
  if (
    booking.calendarEventId &&
    booking.meetingLink &&
    /^https:\/\/meet\.google\.com\/[a-z0-9-]+/i.test(booking.meetingLink) &&
    booking.calendarEventStatus === 'confirmed'
  ) {
    return {
      created: true,
      reusedExisting: true,
      calendarEventId: booking.calendarEventId,
      meetingLink: booking.meetingLink,
      meetConferenceId: booking.meetConferenceId
    };
  }

  const tokenInfo = await getValidAccessToken();
  if (!tokenInfo.accessToken) {
    booking.calendarEventStatus = 'not_created';
    booking.calendarLastError = tokenInfo.error || 'Google Calendar not connected';
    await booking.save();
    return {
      created: false,
      reason: tokenInfo.error || 'google_calendar_not_connected',
      meetingLink: null
    };
  }

  const windowInfo = computeSessionWindow(booking);
  const eventPayload = buildCalendarEventPayload(booking, windowInfo, tokenInfo.connectedEmail);
  const calendarId = encodeURIComponent(tokenInfo.calendarId || 'primary');

  let eventData = null;
  let lastError = null;

  // Bounded retry loop for transient 429/5xx errors
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const resp = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1&sendUpdates=all`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenInfo.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventPayload)
        }
      );

      const data = await resp.json();
      if (resp.ok && data && data.id) {
        eventData = data;
        break;
      }

      lastError = data?.error?.message || `Google Calendar API HTTP ${resp.status}`;
      if (resp.status === 429 || resp.status >= 500) {
        await sleep(500 * attempt);
        continue;
      }
      break;
    } catch (netErr) {
      lastError = netErr.message;
      await sleep(500 * attempt);
    }
  }

  if (!eventData || !eventData.id) {
    booking.calendarEventStatus = 'failed';
    booking.calendarLastError = lastError || 'Failed to create Google Calendar event';
    await booking.save();
    console.error('[GoogleMeetService] Failed to create Calendar event:', booking.calendarLastError);
    return {
      created: false,
      reason: 'calendar_api_error',
      error: booking.calendarLastError,
      meetingLink: null
    };
  }

  let { meetUrl, conferenceId, statusCode } = extractMeetDetailsFromEvent(eventData);

  // Handle asynchronous / pending conference creation by polling GET event up to 3 times
  let pollAttempt = 0;
  while (!meetUrl && statusCode === 'pending' && pollAttempt < 3) {
    pollAttempt += 1;
    await sleep(700 * pollAttempt);
    try {
      const pollResp = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(
          eventData.id
        )}?conferenceDataVersion=1`,
        {
          headers: { Authorization: `Bearer ${tokenInfo.accessToken}` }
        }
      );
      if (pollResp.ok) {
        const polledEvent = await pollResp.json();
        const extracted = extractMeetDetailsFromEvent(polledEvent);
        meetUrl = extracted.meetUrl;
        conferenceId = extracted.conferenceId || conferenceId;
        statusCode = extracted.statusCode;
      }
    } catch (_) {
      // Ignore transient poll error
    }
  }

  booking.calendarEventId = eventData.id;
  booking.calendarHtmlLink = eventData.htmlLink || null;
  booking.meetConferenceId = conferenceId || null;
  booking.meetingLink = meetUrl || null;
  booking.scheduledStartAt = windowInfo.startDate;
  booking.scheduledEndAt = windowInfo.endDate;
  booking.calendarEventStatus = meetUrl ? 'confirmed' : 'pending';
  booking.calendarLastError = meetUrl
    ? null
    : 'Calendar event created, but Google Meet conference link is still pending.';

  await booking.save();

  return {
    created: Boolean(meetUrl),
    calendarEventId: booking.calendarEventId,
    calendarHtmlLink: booking.calendarHtmlLink,
    meetingLink: booking.meetingLink,
    meetConferenceId: booking.meetConferenceId,
    calendarEventStatus: booking.calendarEventStatus
  };
}

/**
 * Reschedule / Update an existing Google Calendar event when booking date/time changes.
 */
async function updateBookingCalendarEvent(bookingDocOrId) {
  const booking =
    typeof bookingDocOrId === 'string' || bookingDocOrId instanceof require('mongoose').Types.ObjectId
      ? await Booking.findById(bookingDocOrId)
      : bookingDocOrId;

  if (!booking) return { updated: false, reason: 'booking_not_found' };

  // If no calendar event exists yet and booking is confirmed, create it now
  if (!booking.calendarEventId) {
    if (booking.status === 'confirmed') {
      return ensureBookingCalendarAndMeet(booking);
    }
    return { updated: false, reason: 'no_existing_calendar_event' };
  }

  const tokenInfo = await getValidAccessToken();
  if (!tokenInfo.accessToken) {
    return { updated: false, reason: tokenInfo.error || 'google_calendar_not_connected' };
  }

  const windowInfo = computeSessionWindow(booking);
  const calendarId = encodeURIComponent(tokenInfo.calendarId || 'primary');
  const bookingId = String(booking._id);
  const shortRef = `#${bookingId.slice(-6).toUpperCase()}`;

  try {
    const resp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(
        booking.calendarEventId
      )}?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenInfo.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: `Unfoldinn 1-on-1: ${booking.name} (Session #${booking.sessionNumber || 1} • ${shortRef})`,
          start: {
            dateTime: windowInfo.startIso,
            timeZone: windowInfo.timezone
          },
          end: {
            dateTime: windowInfo.endIso,
            timeZone: windowInfo.timezone
          }
        })
      }
    );

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      booking.calendarLastError =
        errData?.error?.message || `Failed to update Calendar event (HTTP ${resp.status})`;
      await booking.save();
      return { updated: false, error: booking.calendarLastError };
    }

    const updatedEvent = await resp.json();
    const { meetUrl, conferenceId } = extractMeetDetailsFromEvent(updatedEvent);
    if (meetUrl) booking.meetingLink = meetUrl;
    if (conferenceId) booking.meetConferenceId = conferenceId;
    booking.scheduledStartAt = windowInfo.startDate;
    booking.scheduledEndAt = windowInfo.endDate;
    booking.calendarEventStatus = booking.meetingLink ? 'confirmed' : 'pending';
    booking.calendarLastError = null;
    await booking.save();

    return {
      updated: true,
      calendarEventId: booking.calendarEventId,
      meetingLink: booking.meetingLink
    };
  } catch (err) {
    booking.calendarLastError = err.message;
    await booking.save();
    return { updated: false, error: err.message };
  }
}

/**
 * Cancel a Google Calendar event when a booking is marked as cancelled.
 */
async function cancelBookingCalendarEvent(bookingDocOrId) {
  const booking =
    typeof bookingDocOrId === 'string' || bookingDocOrId instanceof require('mongoose').Types.ObjectId
      ? await Booking.findById(bookingDocOrId)
      : bookingDocOrId;

  if (!booking || !booking.calendarEventId) {
    return { cancelled: false, reason: 'no_calendar_event' };
  }

  const tokenInfo = await getValidAccessToken();
  if (!tokenInfo.accessToken) {
    return { cancelled: false, reason: tokenInfo.error || 'google_calendar_not_connected' };
  }

  const calendarId = encodeURIComponent(tokenInfo.calendarId || 'primary');

  try {
    const resp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(
        booking.calendarEventId
      )}?sendUpdates=all`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenInfo.accessToken}`
        }
      }
    );

    if (resp.ok || resp.status === 404 || resp.status === 410) {
      booking.calendarEventStatus = 'cancelled';
      booking.calendarLastError = null;
      await booking.save();
      return { cancelled: true, calendarEventId: booking.calendarEventId };
    }

    const errData = await resp.json().catch(() => ({}));
    booking.calendarLastError =
      errData?.error?.message || `Failed to cancel Calendar event (HTTP ${resp.status})`;
    await booking.save();
    return { cancelled: false, error: booking.calendarLastError };
  } catch (err) {
    booking.calendarLastError = err.message;
    await booking.save();
    return { cancelled: false, error: err.message };
  }
}

module.exports = {
  REQUIRED_SCOPES,
  encryptSecret,
  decryptSecret,
  resolveRedirectUri,
  createAdminGoogleAuthUrl,
  handleAdminGoogleCallback,
  getGoogleIntegrationStatus,
  disconnectGoogleIntegration,
  getValidAccessToken,
  computeSessionWindow,
  extractMeetDetailsFromEvent,
  buildCalendarEventPayload,
  ensureBookingCalendarAndMeet,
  updateBookingCalendarEvent,
  cancelBookingCalendarEvent
};
