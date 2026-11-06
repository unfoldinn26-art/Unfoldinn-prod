const crypto = require('crypto');
const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');

// Configuration getters so runtime environment changes or test overrides are respected
function getEmailConfig() {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (
    process.env.EMAIL_FROM || 'Unfoldinn <notifications@unfoldinn.com>'
  ).trim();
  const fallbackFrom = (
    process.env.EMAIL_FALLBACK_FROM || 'Unfoldinn <onboarding@resend.dev>'
  ).trim();
  const replyTo = (
    process.env.EMAIL_REPLY_TO || 'unfoldinn26@gmail.com'
  ).trim();
  const adminEmail = (
    process.env.ADMIN_NOTIFICATION_EMAIL || 'unfoldinn26@gmail.com'
  )
    .trim()
    .toLowerCase();
  const frontendUrl = (
    process.env.FRONTEND_URL || 'https://www.unfoldinn.com'
  )
    .trim()
    .replace(/\/+$/, '');

  return {
    apiKey,
    from,
    fallbackFrom,
    replyTo,
    adminEmail,
    frontendUrl
  };
}

let cachedResendKey = null;
let cachedResendInstance = null;

function getResendClient(apiKey) {
  if (!apiKey) return null;
  if (cachedResendInstance && cachedResendKey === apiKey) {
    return cachedResendInstance;
  }
  cachedResendKey = apiKey;
  cachedResendInstance = new Resend(apiKey);
  return cachedResendInstance;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESERVED_DUMMY_DOMAINS = new Set(['example.com', 'example.org', 'example.net', 'invalid', 'test']);

function isValidEmailAddress(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmed)) return false;
  const domain = trimmed.split('@')[1];
  if (!domain || RESERVED_DUMMY_DOMAINS.has(domain)) return false;
  return true;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientResendError(err) {
  if (!err) return false;
  const statusCode = Number(err.statusCode || err.status || 0);
  if (statusCode === 429 || statusCode >= 500) return true;
  const name = String(err.name || '').toLowerCase();
  return (
    name.includes('rate_limit') ||
    name.includes('internal_server_error') ||
    name.includes('application_error') ||
    name.includes('fetch')
  );
}

function isUnverifiedDomainError(err) {
  if (!err) return false;
  const statusCode = Number(err.statusCode || err.status || 0);
  const msg = String(err.message || '').toLowerCase();
  return (
    statusCode === 403 &&
    (msg.includes('domain is not verified') ||
      msg.includes('can only send testing emails') ||
      msg.includes('verify a domain'))
  );
}

function canUseResendSandboxFallback(recipientEmail, adminEmail) {
  const normalized = String(recipientEmail || '').trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized === adminEmail ||
    normalized === 'unfoldinn26@gmail.com' ||
    normalized.endsWith('@resend.dev')
  );
}

async function trySmtpFallback({ to, replyTo, subject, html, text }) {
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  if (!user || !pass) return null;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || `"Unfoldinn" <${user}>`,
    to,
    replyTo,
    subject,
    text,
    html
  });

  return info && info.messageId ? info.messageId : 'smtp-sent';
}

async function recordEmailLog(entry) {
  try {
    await EmailLog.findOneAndUpdate(
      { idempotencyKey: entry.idempotencyKey },
      { $set: entry },
      { upsert: true, new: true }
    );
  } catch (dbErr) {
    console.error('[EmailService] Failed to persist EmailLog:', dbErr.message);
  }
}

/**
 * Core transactional email dispatcher via Resend SDK.
 * Follows https://resend.com/docs/send-with-nodejs:
 *   const { data, error } = await resend.emails.send(payload, { idempotencyKey });
 * Never throws uncaught exceptions so calling routes (bookings, payments, enquiries)
 * are never broken by email provider errors.
 */
async function sendTransactionalEmail({
  workflow,
  to,
  subject,
  html,
  text,
  replyTo,
  idempotencyKey,
  metadata = {},
  allowDuplicate = false
}) {
  const config = getEmailConfig();
  const recipient = String(to || '').trim().toLowerCase();
  const effectiveReplyTo = (replyTo || config.replyTo).trim();
  const effectiveKey =
    idempotencyKey ||
    `${workflow || 'generic'}:${recipient}:${crypto.randomUUID()}`;

  // 1. Validate recipient format
  if (!isValidEmailAddress(recipient)) {
    const logData = {
      idempotencyKey: effectiveKey,
      workflow: workflow || 'unknown',
      recipient: recipient || 'invalid',
      from: config.from,
      replyTo: effectiveReplyTo,
      subject: subject || '(no subject)',
      provider: 'resend',
      providerMessageId: null,
      status: 'skipped_invalid_recipient',
      fallbackSenderUsed: false,
      attempts: 0,
      errorMessage: 'Invalid recipient email address format',
      metadata
    };
    await recordEmailLog(logData);
    return {
      sent: false,
      status: 'skipped_invalid_recipient',
      idempotencyKey: effectiveKey,
      error: 'Invalid recipient email address format'
    };
  }

  // 2. Check persisted idempotency log so repeated requests/webhooks never duplicate emails
  if (!allowDuplicate && idempotencyKey) {
    try {
      const existing = await EmailLog.findOne({ idempotencyKey: effectiveKey }).lean();
      if (existing && existing.status === 'sent') {
        return {
          sent: true,
          deduplicated: true,
          status: 'sent',
          id: existing.providerMessageId,
          idempotencyKey: effectiveKey
        };
      }
    } catch (lookupErr) {
      console.error('[EmailService] Idempotency lookup warning:', lookupErr.message);
    }
  }

  // 3. Check RESEND_API_KEY configuration
  if (!config.apiKey) {
    const logData = {
      idempotencyKey: effectiveKey,
      workflow: workflow || 'unknown',
      recipient,
      from: config.from,
      replyTo: effectiveReplyTo,
      subject,
      provider: 'resend',
      providerMessageId: null,
      status: 'skipped_missing_key',
      fallbackSenderUsed: false,
      attempts: 0,
      errorMessage: 'RESEND_API_KEY is not configured on the server',
      metadata
    };
    await recordEmailLog(logData);
    console.warn(`[EmailService] Skipped '${workflow}' email: RESEND_API_KEY is missing.`);
    return {
      sent: false,
      status: 'skipped_missing_key',
      idempotencyKey: effectiveKey,
      error: 'RESEND_API_KEY is not configured'
    };
  }

  const resend = getResendClient(config.apiKey);
  const maxAttempts = 3;
  let attempts = 0;
  let lastError = null;

  // 4. Send with bounded retry for transient (429 / 5xx) failures
  while (attempts < maxAttempts) {
    attempts += 1;
    try {
      const { data, error } = await resend.emails.send(
        {
          from: config.from,
          to: [recipient],
          replyTo: effectiveReplyTo,
          subject,
          html,
          text
        },
        {
          idempotencyKey: effectiveKey
        }
      );

      if (!error && data && data.id) {
        await recordEmailLog({
          idempotencyKey: effectiveKey,
          workflow: workflow || 'unknown',
          recipient,
          from: config.from,
          replyTo: effectiveReplyTo,
          subject,
          provider: 'resend',
          providerMessageId: data.id,
          status: 'sent',
          fallbackSenderUsed: false,
          attempts,
          errorMessage: null,
          metadata
        });
        return {
          sent: true,
          status: 'sent',
          id: data.id,
          idempotencyKey: effectiveKey,
          fallbackSenderUsed: false
        };
      }

      lastError = error || { message: 'Unknown Resend API error' };

      // 5. Handle pending DNS verification on custom domain (`unfoldinn.com`)
      if (isUnverifiedDomainError(lastError)) {
        // 5a. If recipient is the business inbox (`unfoldinn26@gmail.com`) or `@resend.dev`,
        // automatically retry using `Unfoldinn <onboarding@resend.dev>` so admin alerts and
        // test emails deliver immediately even before DNS verification is clicked in Resend.
        if (canUseResendSandboxFallback(recipient, config.adminEmail)) {
          const fallbackKey = `${effectiveKey}:sandbox-fallback`;
          const fallbackResp = await resend.emails.send(
            {
              from: config.fallbackFrom,
              to: [recipient],
              replyTo: effectiveReplyTo,
              subject,
              html,
              text
            },
            {
              idempotencyKey: fallbackKey
            }
          );

          if (!fallbackResp.error && fallbackResp.data && fallbackResp.data.id) {
            await recordEmailLog({
              idempotencyKey: effectiveKey,
              workflow: workflow || 'unknown',
              recipient,
              from: config.fallbackFrom,
              replyTo: effectiveReplyTo,
              subject,
              provider: 'resend',
              providerMessageId: fallbackResp.data.id,
              status: 'sent',
              fallbackSenderUsed: true,
              attempts: attempts + 1,
              errorMessage: null,
              metadata: {
                ...metadata,
                note: 'Delivered via onboarding@resend.dev while unfoldinn.com DNS verification is pending'
              }
            });
            return {
              sent: true,
              status: 'sent',
              id: fallbackResp.data.id,
              idempotencyKey: effectiveKey,
              fallbackSenderUsed: true
            };
          }
        }

        // 5b. For external recipients while domain verification is pending, try optional SMTP fallback if present
        try {
          const smtpMessageId = await trySmtpFallback({
            to: recipient,
            replyTo: effectiveReplyTo,
            subject,
            html,
            text
          });
          if (smtpMessageId) {
            await recordEmailLog({
              idempotencyKey: effectiveKey,
              workflow: workflow || 'unknown',
              recipient,
              from: process.env.SMTP_USER,
              replyTo: effectiveReplyTo,
              subject,
              provider: 'smtp-fallback',
              providerMessageId: smtpMessageId,
              status: 'sent',
              fallbackSenderUsed: true,
              attempts,
              errorMessage: null,
              metadata
            });
            return {
              sent: true,
              status: 'sent',
              id: smtpMessageId,
              idempotencyKey: effectiveKey,
              fallbackSenderUsed: true
            };
          }
        } catch (smtpErr) {
          console.warn('[EmailService] Optional SMTP fallback failed:', smtpErr.message);
        }

        // 5c. Record `skipped_unverified_domain` cleanly without retrying in a loop
        const pendingMsg =
          lastError.message ||
          'Sender domain unfoldinn.com is pending verification in Resend dashboard';
        await recordEmailLog({
          idempotencyKey: effectiveKey,
          workflow: workflow || 'unknown',
          recipient,
          from: config.from,
          replyTo: effectiveReplyTo,
          subject,
          provider: 'resend',
          providerMessageId: null,
          status: 'skipped_unverified_domain',
          fallbackSenderUsed: false,
          attempts,
          errorMessage: pendingMsg,
          metadata
        });
        console.warn(`[EmailService] Domain pending verification for workflow '${workflow}': ${pendingMsg}`);
        return {
          sent: false,
          status: 'skipped_unverified_domain',
          idempotencyKey: effectiveKey,
          error: pendingMsg
        };
      }

      if (attempts < maxAttempts && isTransientResendError(lastError)) {
        await sleep(300 * attempts);
        continue;
      }
      break;
    } catch (networkErr) {
      lastError = networkErr;
      if (attempts < maxAttempts) {
        await sleep(300 * attempts);
        continue;
      }
      break;
    }
  }

  const errorMessage =
    (lastError && (lastError.message || lastError.name)) ||
    'Email delivery failed';

  await recordEmailLog({
    idempotencyKey: effectiveKey,
    workflow: workflow || 'unknown',
    recipient,
    from: config.from,
    replyTo: effectiveReplyTo,
    subject,
    provider: 'resend',
    providerMessageId: null,
    status: 'failed',
    fallbackSenderUsed: false,
    attempts,
    errorMessage,
    metadata
  });

  console.error(`[EmailService] Failed workflow '${workflow}' after ${attempts} attempt(s): ${errorMessage}`);
  return {
    sent: false,
    status: 'failed',
    idempotencyKey: effectiveKey,
    error: errorMessage
  };
}

// ---------------------------------------------------------------------------
// Branded HTML & Plain-Text Layout Builder
// ---------------------------------------------------------------------------
function renderBrandEmailLayout({
  eyebrow = 'UNFOLDINN',
  title,
  greeting,
  introHtml,
  detailsRows = [],
  calloutTitle = '',
  calloutBodyHtml = '',
  ctaLabel = '',
  ctaUrl = '',
  closingHtml = '',
  footerNote = 'This is an automated transactional message from Unfoldinn.'
}) {
  const config = getEmailConfig();
  const publicAssetBaseUrl =
    config.frontendUrl &&
    !config.frontendUrl.includes('localhost') &&
    !config.frontendUrl.includes('127.0.0.1')
      ? config.frontendUrl
      : 'https://www.unfoldinn.com';
  const logoUrl = `${publicAssetBaseUrl}/logo.jpg`;

  const rowsHtml =
    detailsRows.length > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 22px 0; background-color: #F8F6F0; border: 1px solid #E5DFD3; border-radius: 12px; overflow: hidden;">
          <tbody>
            ${detailsRows
              .filter((r) => r && r.value !== undefined && r.value !== null && String(r.value).trim() !== '')
              .map(
                (r, idx, arr) => `
              <tr>
                <td style="padding: 12px 16px; font-size: 13px; color: #6E6A63; font-weight: 600; width: 38%; vertical-align: top; ${
                  idx < arr.length - 1 ? 'border-bottom: 1px solid #EAE4D8;' : ''
                }">${escapeHtml(r.label)}</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #1C1B18; font-weight: 500; vertical-align: top; ${
                  idx < arr.length - 1 ? 'border-bottom: 1px solid #EAE4D8;' : ''
                }">${r.isSafeHtml ? r.value : escapeHtml(r.value)}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>`
      : '';

  const calloutHtml = calloutBodyHtml
    ? `<div style="margin: 22px 0; padding: 18px 20px; background-color: #FDFBF7; border-left: 4px solid #B85D3B; border-radius: 8px; border-top: 1px solid #EFEAE0; border-right: 1px solid #EFEAE0; border-bottom: 1px solid #EFEAE0;">
        ${
          calloutTitle
            ? `<p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #B85D3B;">${escapeHtml(
                calloutTitle
              )}</p>`
            : ''
        }
        <div style="margin: 0; font-size: 14px; line-height: 1.65; color: #2C2A26;">${calloutBodyHtml}</div>
      </div>`
    : '';

  const ctaHtml =
    ctaLabel && ctaUrl
      ? `<div style="margin: 26px 0 18px 0;">
          <a href="${escapeHtml(
            ctaUrl
          )}" style="display: inline-block; background-color: #1C1B18; color: #F8F6F0; text-decoration: none; font-size: 14px; font-weight: 600; padding: 13px 24px; border-radius: 8px; letter-spacing: 0.02em;">${escapeHtml(
          ctaLabel
        )}</a>
        </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3EFE6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1C1B18;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3EFE6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E5DFD3; overflow: hidden; box-shadow: 0 4px 20px rgba(28, 27, 24, 0.04);">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; background-color: #1C1B18; color: #F8F6F0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #D49A7D; font-weight: 700;">${escapeHtml(
                      eyebrow
                    )}</p>
                    <h1 style="margin: 8px 0 0 0; font-size: 22px; line-height: 1.3; font-weight: 600; color: #F8F6F0; font-family: Georgia, 'Times New Roman', serif;">${escapeHtml(
                      title
                    )}</h1>
                  </td>
                  <td align="right" style="vertical-align: top; padding-left: 16px;">
                    <a href="${escapeHtml(
                      publicAssetBaseUrl
                    )}" style="display: inline-block; text-decoration: none; color: #F8F6F0; font-size: 13px; font-weight: 600;">
                      <img src="${escapeHtml(
                        logoUrl
                      )}" alt="Unfoldinn" width="52" height="52" style="display: block; width: 52px; height: 52px; object-fit: cover; border-radius: 10px; background-color: #FAF7F0; border: 1px solid rgba(248, 246, 240, 0.25);" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 30px 32px;">
              ${
                greeting
                  ? `<p style="margin: 0 0 14px 0; font-size: 16px; font-weight: 600; color: #1C1B18;">${escapeHtml(
                      greeting
                    )}</p>`
                  : ''
              }
              <div style="font-size: 15px; line-height: 1.65; color: #3A3731;">
                ${introHtml}
              </div>
              ${rowsHtml}
              ${calloutHtml}
              ${ctaHtml}
              ${
                closingHtml
                  ? `<div style="margin-top: 22px; font-size: 14px; line-height: 1.65; color: #4A463F;">${closingHtml}</div>`
                  : ''
              }
              <p style="margin: 26px 0 0 0; font-size: 14px; line-height: 1.6; color: #1C1B18;">
                Warm regards,<br />
                <strong>Deepak &amp; Team Unfoldinn</strong><br />
                <span style="font-size: 13px; color: #6E6A63;">Thoughtful 1-on-1 Mentorship for Students &amp; Young Adults</span>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #F8F6F0; border-top: 1px solid #E5DFD3; font-size: 12px; line-height: 1.6; color: #6E6A63;">
              <p style="margin: 0 0 6px 0;">
                Need assistance? Reply directly to this email or write to us at
                <a href="mailto:${escapeHtml(
                  config.replyTo
                )}" style="color: #B85D3B; text-decoration: none; font-weight: 600;">${escapeHtml(
    config.replyTo
  )}</a>.
              </p>
              <p style="margin: 0;">
                <a href="${escapeHtml(
                  config.frontendUrl
                )}" style="color: #6E6A63; text-decoration: underline;">www.unfoldinn.com</a>
                &nbsp;&bull;&nbsp; ${escapeHtml(footerNote)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// 1. Authentication & Email Verification OTP (Sign-Up Verification + Login 2FA)
// ---------------------------------------------------------------------------
async function sendEmailOtp({ email, otp, name, purpose = 'email_verify', idempotencyKey }) {
  const cleanName = name ? String(name).trim() : 'there';
  const isLogin2FA = purpose === 'login_2fa';

  const subject = isLogin2FA
    ? 'Your Unfoldinn 2-Step Sign-In (2FA) Code'
    : 'Verify your email address — Unfoldinn';

  const html = renderBrandEmailLayout({
    eyebrow: isLogin2FA ? '2-FACTOR AUTHENTICATION (2FA)' : 'EMAIL VERIFICATION',
    title: isLogin2FA ? '2-Step Sign-In Verification Code' : 'Verify Your Email Address',
    greeting: `Hi ${cleanName},`,
    introHtml: isLogin2FA
      ? `<p style="margin: 0 0 12px 0;">Your password was verified. Please enter the 6-digit <strong>2-Factor Authentication (2FA)</strong> code below to complete signing in to your Unfoldinn account. This code expires in <strong>10 minutes</strong>.</p>`
      : `<p style="margin: 0 0 12px 0;">Please use the single-use 6-digit verification code below to confirm your email address and activate your Unfoldinn account. This code expires in <strong>10 minutes</strong>.</p>`,
    calloutTitle: isLogin2FA ? '2FA Security Code' : 'One-Time Verification Code',
    calloutBodyHtml: `<p style="margin: 4px 0; font-size: 28px; font-weight: 700; letter-spacing: 0.25em; color: #1C1B18; font-family: 'Courier New', Courier, monospace;">${escapeHtml(
      otp
    )}</p>`,
    closingHtml: `<p style="margin: 0;">For your security, never share this code with anyone. If you did not initiate this request, please ignore this email.</p>`
  });

  const text = [
    `Hi ${cleanName},`,
    '',
    isLogin2FA
      ? `Your Unfoldinn 2-Factor Authentication (2FA) sign-in code is: ${otp}`
      : `Your Unfoldinn email verification code is: ${otp}`,
    '',
    'This single-use code is valid for 10 minutes. For your security, do not share it with anyone.',
    'If you did not request this code, please ignore this email.',
    '',
    'Warm regards,',
    'Deepak & Team Unfoldinn',
    'https://www.unfoldinn.com'
  ].join('\n');

  return sendTransactionalEmail({
    workflow: 'auth_email_otp',
    to: email,
    subject,
    html,
    text,
    idempotencyKey:
      idempotencyKey || `auth_email_otp:${String(email).toLowerCase()}:${Date.now()}`,
    metadata: { purpose: purpose || 'email_verification' }
  });
}

// ---------------------------------------------------------------------------
// 2. Account Registration Welcome Email
// ---------------------------------------------------------------------------
async function sendWelcomeEmail(user) {
  if (!user || !user.email) return { sent: false, status: 'skipped_invalid_recipient' };
  const config = getEmailConfig();
  const cleanName = user.name || 'there';
  const subject = 'Welcome to Unfoldinn';

  const html = renderBrandEmailLayout({
    eyebrow: 'WELCOME TO UNFOLDINN',
    title: 'Your Mentorship Space Is Ready',
    greeting: `Hello ${cleanName},`,
    introHtml: `<p style="margin: 0 0 12px 0;">Thank you for creating your account with Unfoldinn. We provide a calm, confidential, and structured 1-on-1 mentorship environment where students and young adults can think clearly about academics, career direction, and personal growth.</p>`,
    detailsRows: [
      { label: 'Account Email', value: user.email },
      { label: 'Role', value: user.role === 'parent' ? 'Parent / Guardian' : 'Student / Mentee' }
    ],
    ctaLabel: 'Explore Your Dashboard',
    ctaUrl: `${config.frontendUrl}/dashboard`,
    closingHtml: `<p style="margin: 0;">Whenever you are ready, you can book a 1-on-1 session or explore our flexible mentorship packs from your dashboard.</p>`
  });

  const text = [
    `Hello ${cleanName},`,
    '',
    'Welcome to Unfoldinn! Your account has been created.',
    `Account Email: ${user.email}`,
    '',
    `Visit your dashboard anytime at: ${config.frontendUrl}/dashboard`,
    '',
    'Warm regards,',
    'Deepak & Team Unfoldinn'
  ].join('\n');

  return sendTransactionalEmail({
    workflow: 'auth_welcome',
    to: user.email,
    subject,
    html,
    text,
    idempotencyKey: `auth_welcome:${user._id || user.email}`,
    metadata: { userId: String(user._id || '') }
  });
}

// ---------------------------------------------------------------------------
// 3. Contact & General Enquiry Emails (Visitor Confirmation + Deepak Alert)
// ---------------------------------------------------------------------------
async function sendContactEmails(contact) {
  if (!contact) return { userEmail: null, adminEmail: null };
  const config = getEmailConfig();
  const contactId = String(contact._id || crypto.randomUUID());
  const enquiryCategory = contact.type || contact.userType || 'General';

  const userSubject = 'We have received your message — Unfoldinn';
  const userHtml = renderBrandEmailLayout({
    eyebrow: 'ENQUIRY RECEIVED',
    title: 'Thank You for Reaching Out',
    greeting: `Hello ${contact.name || 'there'},`,
    introHtml: `<p style="margin: 0 0 12px 0;">We have received your enquiry and Deepak's team will review it shortly. We typically respond within 24 hours on working days.</p>`,
    detailsRows: [
      { label: 'Reference ID', value: `#${contactId.slice(-6).toUpperCase()}` },
      { label: 'Subject', value: contact.subject || 'Website Enquiry' },
      { label: 'Enquiry Type', value: enquiryCategory },
      { label: 'Submitted Email', value: contact.email }
    ],
    calloutTitle: 'Your Message Summary',
    calloutBodyHtml: `<p style="margin: 0; white-space: pre-line;">${escapeHtml(
      contact.message || ''
    )}</p>`,
    ctaLabel: 'Visit Unfoldinn',
    ctaUrl: config.frontendUrl
  });

  const userText = [
    `Hello ${contact.name || 'there'},`,
    '',
    'Thank you for reaching out to Unfoldinn. We have received your message and will respond within 24 hours.',
    '',
    `Subject: ${contact.subject || 'Website Enquiry'}`,
    `Enquiry Type: ${enquiryCategory}`,
    `Your Message: ${contact.message || ''}`,
    '',
    'Warm regards,',
    'Deepak & Team Unfoldinn'
  ].join('\n');

  const adminSubject = 'New website enquiry received — Unfoldinn';
  const adminHtml = renderBrandEmailLayout({
    eyebrow: 'ADMIN NOTIFICATION',
    title: 'New Contact Form Submission',
    greeting: 'Hello Deepak,',
    introHtml: `<p style="margin: 0 0 12px 0;">A new enquiry has been submitted through the Unfoldinn contact form. You can reply directly to this email to respond to <strong>${escapeHtml(
      contact.name
    )}</strong>.</p>`,
    detailsRows: [
      { label: 'Name', value: contact.name },
      { label: 'Email', value: contact.email },
      { label: 'Phone', value: contact.phone || 'Not provided' },
      { label: 'Subject', value: contact.subject || 'Website Enquiry' },
      { label: 'Role / Category', value: enquiryCategory },
      { label: 'Submitted At', value: new Date(contact.createdAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }
    ],
    calloutTitle: 'Enquiry Message',
    calloutBodyHtml: `<p style="margin: 0; white-space: pre-line;">${escapeHtml(
      contact.message || ''
    )}</p>`,
    ctaLabel: 'Open Admin Dashboard',
    ctaUrl: `${config.frontendUrl}/admin`
  });

  const adminText = [
    'Hello Deepak,',
    '',
    'A new contact enquiry was submitted on Unfoldinn:',
    `Name: ${contact.name}`,
    `Email: ${contact.email}`,
    `Phone: ${contact.phone || 'Not provided'}`,
    `Subject: ${contact.subject || 'Website Enquiry'}`,
    `Category: ${enquiryCategory}`,
    `Message: ${contact.message || ''}`,
    '',
    `Manage in Admin Dashboard: ${config.frontendUrl}/admin`
  ].join('\n');

  const [userRes, adminRes] = await Promise.allSettled([
    sendTransactionalEmail({
      workflow: 'contact_user_confirmation',
      to: contact.email,
      subject: userSubject,
      html: userHtml,
      text: userText,
      idempotencyKey: `contact_user_confirmation:${contactId}`,
      metadata: { contactId }
    }),
    sendTransactionalEmail({
      workflow: 'contact_admin_alert',
      to: config.adminEmail,
      replyTo: isValidEmailAddress(contact.email) ? contact.email : config.replyTo,
      subject: adminSubject,
      html: adminHtml,
      text: adminText,
      idempotencyKey: `contact_admin_alert:${contactId}`,
      metadata: { contactId }
    })
  ]);

  return {
    userEmail: userRes.status === 'fulfilled' ? userRes.value : { sent: false },
    adminEmail: adminRes.status === 'fulfilled' ? adminRes.value : { sent: false }
  };
}

// ---------------------------------------------------------------------------
// 4. Institutional / School Partnership Enquiry Emails
// ---------------------------------------------------------------------------
async function sendInstitutionEnquiryEmails(enquiry) {
  if (!enquiry) return { userEmail: null, adminEmail: null };
  const config = getEmailConfig();
  const enquiryId = String(enquiry._id || crypto.randomUUID());
  const contactPerson = enquiry.contactPerson || enquiry.contactName || 'Partner';
  const designation = enquiry.designation || enquiry.role || '';
  const cohortInfo = enquiry.studentStrength || enquiry.studentAgeGroup || 'Not specified';
  const enquiryMessage = enquiry.enquiryNature || enquiry.message || 'No additional notes provided.';

  const userSubject = 'Institutional partnership enquiry received — Unfoldinn';
  const userHtml = renderBrandEmailLayout({
    eyebrow: 'INSTITUTIONAL PARTNERSHIPS',
    title: 'Thank You for Your Partnership Enquiry',
    greeting: `Dear ${contactPerson},`,
    introHtml: `<p style="margin: 0 0 12px 0;">Thank you for expressing interest in bringing Unfoldinn mentorship to <strong>${escapeHtml(
      enquiry.institutionName
    )}</strong>. Deepak's office has received your institutional details and will connect with you shortly to discuss a tailored format.</p>`,
    detailsRows: [
      { label: 'Institution', value: enquiry.institutionName },
      { label: 'Contact Person', value: `${contactPerson}${designation ? ` (${designation})` : ''}` },
      { label: 'City', value: enquiry.city || 'Not specified' },
      { label: 'Cohort / Strength', value: cohortInfo }
    ],
    ctaLabel: 'Explore Unfoldinn',
    ctaUrl: `${config.frontendUrl}/institutions`
  });

  const userText = [
    `Dear ${contactPerson},`,
    '',
    `Thank you for your institutional enquiry on behalf of ${enquiry.institutionName}.`,
    'Deepak and our partnerships team have received your details and will get in touch with you shortly.',
    '',
    'Warm regards,',
    'Deepak & Team Unfoldinn'
  ].join('\n');

  const adminSubject = 'New institution partnership enquiry — Unfoldinn';
  const adminHtml = renderBrandEmailLayout({
    eyebrow: 'INSTITUTIONAL ENQUIRY ALERT',
    title: 'New School / College Partnership Request',
    greeting: 'Hello Deepak,',
    introHtml: `<p style="margin: 0 0 12px 0;">An institutional partnership request has been submitted. You can reply directly to this email to reach the institutional representative.</p>`,
    detailsRows: [
      { label: 'Institution Name', value: enquiry.institutionName },
      { label: 'Institution Type', value: enquiry.institutionType || 'Not specified' },
      { label: 'Contact Person', value: contactPerson },
      { label: 'Designation / Role', value: designation || 'Not specified' },
      { label: 'Email', value: enquiry.email },
      { label: 'Phone', value: enquiry.phone },
      { label: 'City / State', value: [enquiry.city, enquiry.state].filter(Boolean).join(', ') || 'Not specified' },
      { label: 'Student Strength', value: cohortInfo }
    ],
    calloutTitle: 'Institutional Notes / Nature of Enquiry',
    calloutBodyHtml: `<p style="margin: 0; white-space: pre-line;">${escapeHtml(
      enquiryMessage
    )}</p>`,
    ctaLabel: 'Review in Admin Dashboard',
    ctaUrl: `${config.frontendUrl}/admin`
  });

  const adminText = [
    'Hello Deepak,',
    '',
    'New Institutional Enquiry on Unfoldinn:',
    `Institution: ${enquiry.institutionName} (${enquiry.institutionType || 'N/A'})`,
    `Contact: ${contactPerson} (${designation || 'N/A'})`,
    `Email: ${enquiry.email}`,
    `Phone: ${enquiry.phone}`,
    `City: ${enquiry.city || 'N/A'}`,
    `Student Strength: ${cohortInfo}`,
    `Enquiry Nature: ${enquiryMessage}`,
    '',
    `Admin Dashboard: ${config.frontendUrl}/admin`
  ].join('\n');

  const [userRes, adminRes] = await Promise.allSettled([
    sendTransactionalEmail({
      workflow: 'institution_user_confirmation',
      to: enquiry.email,
      subject: userSubject,
      html: userHtml,
      text: userText,
      idempotencyKey: `institution_user_confirmation:${enquiryId}`,
      metadata: { enquiryId }
    }),
    sendTransactionalEmail({
      workflow: 'institution_admin_alert',
      to: config.adminEmail,
      replyTo: isValidEmailAddress(enquiry.email) ? enquiry.email : config.replyTo,
      subject: adminSubject,
      html: adminHtml,
      text: adminText,
      idempotencyKey: `institution_admin_alert:${enquiryId}`,
      metadata: { enquiryId }
    })
  ]);

  return {
    userEmail: userRes.status === 'fulfilled' ? userRes.value : { sent: false },
    adminEmail: adminRes.status === 'fulfilled' ? adminRes.value : { sent: false }
  };
}

// ---------------------------------------------------------------------------
// 5. Support Ticket Emails (User Confirmation + Admin Alert)
// ---------------------------------------------------------------------------
async function sendSupportTicketEmails(ticket) {
  if (!ticket) return { userEmail: null, adminEmail: null };
  const config = getEmailConfig();
  const ticketId = String(ticket._id || crypto.randomUUID());
  const shortRef = `#${ticketId.slice(-6).toUpperCase()}`;
  const ticketBody = ticket.description || ticket.message || '';

  const userSubject = `Support request received (${shortRef}) — Unfoldinn`;
  const userHtml = renderBrandEmailLayout({
    eyebrow: 'SUPPORT DESK',
    title: 'We Have Logged Your Support Request',
    greeting: `Hello ${ticket.name || 'there'},`,
    introHtml: `<p style="margin: 0 0 12px 0;">Your support request has been received by Unfoldinn. Our team will look into your query and respond to you shortly.</p>`,
    detailsRows: [
      { label: 'Ticket Reference', value: shortRef },
      { label: 'Subject', value: ticket.subject || 'General Help' },
      { label: 'Category', value: ticket.category || 'support' },
      { label: 'Status', value: 'Open — Under Review' }
    ],
    calloutTitle: 'Your Message',
    calloutBodyHtml: `<p style="margin: 0; white-space: pre-line;">${escapeHtml(
      ticketBody
    )}</p>`
  });

  const userText = [
    `Hello ${ticket.name || 'there'},`,
    '',
    `Your support request (${shortRef}) has been logged with Unfoldinn.`,
    `Subject: ${ticket.subject || 'General Help'}`,
    `Message: ${ticketBody}`,
    '',
    'We will get back to you shortly.',
    'Warm regards,',
    'Deepak & Team Unfoldinn'
  ].join('\n');

  const adminSubject = `New support ticket (${shortRef}) — Unfoldinn`;
  const adminHtml = renderBrandEmailLayout({
    eyebrow: 'SUPPORT ESCALATION',
    title: `New Support Ticket ${shortRef}`,
    greeting: 'Hello Deepak,',
    introHtml: `<p style="margin: 0 0 12px 0;">A user has raised a support ticket on Unfoldinn. Reply directly to this email to respond to <strong>${escapeHtml(
      ticket.name
    )}</strong>.</p>`,
    detailsRows: [
      { label: 'Ticket Reference', value: shortRef },
      { label: 'Name', value: ticket.name },
      { label: 'Email', value: ticket.email },
      { label: 'Phone', value: ticket.phone || 'Not provided' },
      { label: 'Category / Priority', value: `${ticket.category || 'general'} (${ticket.priority || 'medium'})` },
      { label: 'Topic / Subject', value: ticket.subject }
    ],
    calloutTitle: 'Support Description',
    calloutBodyHtml: `<p style="margin: 0; white-space: pre-line;">${escapeHtml(
      ticketBody
    )}</p>`,
    ctaLabel: 'View Support Tickets',
    ctaUrl: `${config.frontendUrl}/admin`
  });

  const adminText = [
    'Hello Deepak,',
    '',
    `New Support Ticket (${shortRef}):`,
    `Name: ${ticket.name}`,
    `Email: ${ticket.email}`,
    `Phone: ${ticket.phone || 'Not provided'}`,
    `Topic: ${ticket.subject}`,
    `Message: ${ticketBody}`,
    '',
    `Admin Dashboard: ${config.frontendUrl}/admin`
  ].join('\n');

  const [userRes, adminRes] = await Promise.allSettled([
    sendTransactionalEmail({
      workflow: 'support_user_confirmation',
      to: ticket.email,
      subject: userSubject,
      html: userHtml,
      text: userText,
      idempotencyKey: `support_user_confirmation:${ticketId}`,
      metadata: { ticketId }
    }),
    sendTransactionalEmail({
      workflow: 'support_admin_alert',
      to: config.adminEmail,
      replyTo: isValidEmailAddress(ticket.email) ? ticket.email : config.replyTo,
      subject: adminSubject,
      html: adminHtml,
      text: adminText,
      idempotencyKey: `support_admin_alert:${ticketId}`,
      metadata: { ticketId }
    })
  ]);

  return {
    userEmail: userRes.status === 'fulfilled' ? userRes.value : { sent: false },
    adminEmail: adminRes.status === 'fulfilled' ? adminRes.value : { sent: false }
  };
}

// ---------------------------------------------------------------------------
// 6. Newsletter Welcome Email
// ---------------------------------------------------------------------------
async function sendNewsletterWelcomeEmail(subscriber) {
  if (!subscriber || !subscriber.email) return { sent: false };
  const config = getEmailConfig();
  const subId = String(subscriber._id || subscriber.email);

  const subject = 'Welcome to notes & reflections from Unfoldinn';
  const html = renderBrandEmailLayout({
    eyebrow: 'UNFOLDINN DISPATCH',
    title: 'Thank You for Subscribing',
    greeting: 'Hello,',
    introHtml: `<p style="margin: 0 0 12px 0;">You are now subscribed to occasional essays and thoughtful perspectives from Deepak and Unfoldinn on clarity, academic transitions, career choices, and parenting young adults.</p>`,
    closingHtml: `<p style="margin: 0;">We respect your inbox and write only when we have something genuinely worthwhile to share.</p>`,
    ctaLabel: 'Read Our Latest Perspectives',
    ctaUrl: config.frontendUrl
  });

  const text = [
    'Hello,',
    '',
    'Thank you for subscribing to updates and reflections from Unfoldinn.',
    `Explore our website: ${config.frontendUrl}`,
    '',
    'Warm regards,',
    'Deepak & Team Unfoldinn'
  ].join('\n');

  return sendTransactionalEmail({
    workflow: 'newsletter_welcome',
    to: subscriber.email,
    subject,
    html,
    text,
    idempotencyKey: `newsletter_welcome:${subId}`,
    metadata: { email: subscriber.email }
  });
}

function formatPreferredDate(dateVal) {
  if (!dateVal) return 'To be scheduled';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// ---------------------------------------------------------------------------
// 7. Booking Confirmation / Request Emails (Student/Parent + Deepak Admin)
//    Safeguarding rule: never place student topics, age, or phone in subjects.
// ---------------------------------------------------------------------------
async function sendBookingConfirmationEmails(booking, options = {}) {
  if (!booking) return { userEmail: null, adminEmail: null };
  const config = getEmailConfig();
  const bookingId = String(booking._id || crypto.randomUUID());
  const shortRef = `#${bookingId.slice(-6).toUpperCase()}`;
  const isConfirmed =
    booking.status === 'confirmed' ||
    booking.paymentStatus === 'paid' ||
    booking.paymentStatus === 'credit_redeemed';
  const stageLabel = options.stage || (isConfirmed ? 'confirmed' : 'created');
  const formattedDate = formatPreferredDate(booking.preferredDate);
  const timezoneLabel = `${booking.timezone || 'Asia/Kolkata'} (IST, UTC+05:30)`;
  const formattedSlot = `${formattedDate} — ${booking.preferredTime || 'Flexible'} (IST)`;
  const isParentBooking = booking.userType === 'parent' || booking.bookedBy === 'parent';
  const hasVerifiedMeetLink =
    Boolean(booking.meetingLink) &&
    /^https:\/\/meet\.google\.com\/[a-z0-9-]+/i.test(String(booking.meetingLink).trim());

  const userSubject = isConfirmed
    ? `Your mentorship session is confirmed (${shortRef}) — Unfoldinn`
    : `We have received your session booking request (${shortRef}) — Unfoldinn`;

  const detailsRows = [
    { label: 'Booking Reference', value: shortRef },
    { label: 'Session Number', value: `Session #${booking.sessionNumber || 1}` },
    { label: 'Participant', value: booking.studentName || booking.name },
    {
      label: 'Role',
      value: isParentBooking
        ? `Parent / Guardian${booking.parentName ? ` (${booking.parentName})` : ''}`
        : 'Student / Mentee'
    },
    { label: 'Scheduled Date & Time', value: formattedSlot },
    { label: 'Timezone', value: timezoneLabel },
    { label: 'Booking Status', value: isConfirmed ? 'Confirmed' : 'Pending Confirmation' },
    {
      label: 'Payment / Credit Status',
      value:
        booking.paymentStatus === 'credit_redeemed'
          ? `Subscription Credit Redeemed (${booking.planCode || 'Active Pack'})`
          : booking.paymentStatus === 'paid'
          ? `Paid (INR ${booking.paymentAmount || booking.amount || 0})`
          : booking.paymentStatus === 'not_required'
          ? 'Complimentary / Direct Booking'
          : booking.paymentStatus || 'Pending'
    }
  ];

  if (hasVerifiedMeetLink && isConfirmed) {
    detailsRows.push({
      label: 'Google Meet Link',
      value: `<a href="${escapeHtml(booking.meetingLink)}" style="color: #B85D3B; font-weight: 700;">${escapeHtml(
        booking.meetingLink
      )}</a>`,
      isSafeHtml: true
    });
  }

  const userHtml = renderBrandEmailLayout({
    eyebrow: isConfirmed ? 'BOOKING CONFIRMED' : 'BOOKING REQUEST LOGGED',
    title: isConfirmed
      ? 'Your 1-on-1 Session with Deepak Is Confirmed'
      : 'Your Session Request Has Been Logged',
    greeting: `Hello ${booking.name || booking.studentName || 'there'},`,
    introHtml: isConfirmed
      ? `<p style="margin: 0 0 12px 0;">Your 1-on-1 mentorship session with Deepak at Unfoldinn is confirmed. Please find your session details below.</p>`
      : `<p style="margin: 0 0 12px 0;">We have saved your mentorship session details on Unfoldinn. Please review your booking summary below.</p>`,
    detailsRows,
    calloutTitle: hasVerifiedMeetLink && isConfirmed ? 'Join via Google Meet' : 'What Happens Next',
    calloutBodyHtml:
      hasVerifiedMeetLink && isConfirmed
        ? `<p style="margin: 0;">Your dedicated Google Meet conference room is ready: <a href="${escapeHtml(
            booking.meetingLink
          )}" style="color: #B85D3B; font-weight: 600;">${escapeHtml(
            booking.meetingLink
          )}</a>. A Google Calendar invitation has also been scheduled for your session.</p>`
        : isConfirmed
        ? `<p style="margin: 0;">Deepak will review your context ahead of the conversation. We will coordinate the session details with you prior to your scheduled slot.</p>`
        : `<p style="margin: 0;">You can check your session status or update your preferred time slot directly from your Unfoldinn dashboard.</p>`,
    ctaLabel: hasVerifiedMeetLink && isConfirmed ? 'Join Google Meet Session' : 'View Your Session Dashboard',
    ctaUrl: hasVerifiedMeetLink && isConfirmed ? booking.meetingLink : `${config.frontendUrl}/dashboard`
  });

  const userText = [
    `Hello ${booking.name || booking.studentName || 'there'},`,
    '',
    isConfirmed
      ? `Your 1-on-1 mentorship session (${shortRef}) with Unfoldinn is confirmed.`
      : `Your session booking request (${shortRef}) has been logged with Unfoldinn.`,
    `Participant: ${booking.studentName || booking.name}`,
    `Scheduled Date & Time: ${formattedSlot}`,
    `Timezone: ${timezoneLabel}`,
    `Status: ${isConfirmed ? 'Confirmed' : 'Pending Confirmation'}`,
    hasVerifiedMeetLink && isConfirmed ? `Google Meet Link: ${booking.meetingLink}` : '',
    '',
    `View your dashboard: ${config.frontendUrl}/dashboard`,
    '',
    'Warm regards,',
    'Deepak & Team Unfoldinn'
  ]
    .filter(Boolean)
    .join('\n');

  const adminSubject = isConfirmed
    ? `Confirmed mentorship booking (${shortRef}) — Unfoldinn`
    : `New mentorship booking request (${shortRef}) — Unfoldinn`;

  const bookingTopic =
    booking.topic ||
    booking.concern ||
    (Array.isArray(booking.topics) ? booking.topics.join(', ') : '') ||
    booking.message ||
    'No additional context shared.';

  const adminRows = [
    { label: 'Booking Reference', value: shortRef },
    { label: 'Session Number', value: `Session #${booking.sessionNumber || 1} (${booking.bookingMode || 'standard'})` },
    { label: 'Participant Name', value: booking.studentName || booking.name },
    { label: 'User Type', value: booking.userType || 'student' },
    { label: 'Age / Group', value: booking.age ? `${booking.age} yrs (${booking.ageGroup || ''})` : booking.ageGroup || 'Not specified' },
    { label: 'Email', value: booking.email || 'Not provided' },
    { label: 'Phone / WhatsApp', value: booking.phone },
    { label: 'City / Institution', value: [booking.city, booking.institutionOrOrg].filter(Boolean).join(' • ') || 'Not specified' },
    { label: 'Preferred Date & Time', value: formattedSlot },
    { label: 'Timezone', value: timezoneLabel },
    { label: 'Booking Status', value: booking.status },
    { label: 'Payment Status', value: `${booking.paymentStatus || 'pending'} (${booking.paymentMode || 'online'})` },
    {
      label: 'Amount',
      value:
        booking.paymentAmount || booking.amount
          ? `INR ${booking.paymentAmount || booking.amount}`
          : booking.paymentStatus === 'credit_redeemed'
          ? `1 Credit (${booking.planCode || 'Pack'})`
          : 'INR 0'
    }
  ];

  if (hasVerifiedMeetLink) {
    adminRows.push({
      label: 'Google Meet Link',
      value: `<a href="${escapeHtml(booking.meetingLink)}" style="color: #B85D3B; font-weight: 700;">${escapeHtml(
        booking.meetingLink
      )}</a>`,
      isSafeHtml: true
    });
  }

  if (booking.isUnder18 && booking.parentName) {
    adminRows.push({
      label: 'Parent / Guardian (Under-18)',
      value: `${booking.parentName} (${booking.parentPhone || 'N/A'}) — Consent: ${
        booking.parentConsentConfirmed ? 'Confirmed' : 'Pending'
      }`
    });
  }

  const adminHtml = renderBrandEmailLayout({
    eyebrow: 'MENTORSHIP BOOKING ALERT',
    title: isConfirmed ? `Session Confirmed (${shortRef})` : `New Booking Request (${shortRef})`,
    greeting: 'Hello Deepak,',
    introHtml: `<p style="margin: 0 0 12px 0;">A mentorship session booking has been ${
      isConfirmed ? 'confirmed' : 'created'
    } on Unfoldinn. You can reply directly to this email to contact <strong>${escapeHtml(
      booking.name || booking.studentName
    )}</strong>.</p>`,
    detailsRows: adminRows,
    calloutTitle: 'Mentee Topic & Goal',
    calloutBodyHtml: `<p style="margin: 0 0 8px 0; white-space: pre-line;"><strong>Topic:</strong> ${escapeHtml(
      bookingTopic
    )}</p>${
      booking.usefulGoal
        ? `<p style="margin: 0; white-space: pre-line;"><strong>Desired Outcome:</strong> ${escapeHtml(
            booking.usefulGoal
          )}</p>`
        : ''
    }`,
    ctaLabel: 'Manage Booking in Admin Panel',
    ctaUrl: `${config.frontendUrl}/admin`
  });

  const adminText = [
    'Hello Deepak,',
    '',
    `Mentorship Booking (${shortRef}) [${stageLabel.toUpperCase()}]:`,
    `Participant: ${booking.studentName || booking.name}`,
    `Email: ${booking.email || 'N/A'}`,
    `Phone: ${booking.phone}`,
    `Preferred Slot: ${formattedSlot}`,
    `Status: ${booking.status} | Payment: ${booking.paymentStatus}`,
    `Topic: ${bookingTopic}`,
    booking.usefulGoal ? `Goal: ${booking.usefulGoal}` : '',
    '',
    `Admin Panel: ${config.frontendUrl}/admin`
  ]
    .filter(Boolean)
    .join('\n');

  const promises = [];
  if (isValidEmailAddress(booking.email)) {
    promises.push(
      sendTransactionalEmail({
        workflow: `booking_user_${stageLabel}`,
        to: booking.email,
        subject: userSubject,
        html: userHtml,
        text: userText,
        idempotencyKey: `booking_user_${stageLabel}:${bookingId}`,
        metadata: { bookingId, stage: stageLabel }
      })
    );
  } else {
    promises.push(Promise.resolve({ sent: false, status: 'skipped_invalid_recipient' }));
  }

  promises.push(
    sendTransactionalEmail({
      workflow: `booking_admin_${stageLabel}`,
      to: config.adminEmail,
      replyTo: isValidEmailAddress(booking.email) ? booking.email : config.replyTo,
      subject: adminSubject,
      html: adminHtml,
      text: adminText,
      idempotencyKey: `booking_admin_${stageLabel}:${bookingId}`,
      metadata: { bookingId, stage: stageLabel }
    })
  );

  const [userRes, adminRes] = await Promise.allSettled(promises);

  return {
    userEmail: userRes.status === 'fulfilled' ? userRes.value : { sent: false },
    adminEmail: adminRes.status === 'fulfilled' ? adminRes.value : { sent: false }
  };
}

// ---------------------------------------------------------------------------
// 8. Booking Status / Reschedule / Meeting Link Update Email
//    Safeguarding rule: never include private mentor `notes` in student emails.
// ---------------------------------------------------------------------------
async function sendBookingStatusUpdateEmail(booking, changeSummary = 'updated') {
  if (!booking) return { sent: false };
  const config = getEmailConfig();
  const bookingId = String(booking._id || crypto.randomUUID());
  const shortRef = `#${bookingId.slice(-6).toUpperCase()}`;
  const formattedDate = formatPreferredDate(booking.preferredDate);
  const timezoneLabel = `${booking.timezone || 'Asia/Kolkata'} (IST, UTC+05:30)`;
  const formattedSlot = `${formattedDate} — ${booking.preferredTime || 'Flexible'} (IST)`;
  const hasVerifiedMeetLink =
    Boolean(booking.meetingLink) &&
    /^https:\/\/meet\.google\.com\/[a-z0-9-]+/i.test(String(booking.meetingLink).trim());

  const statusMap = {
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    pending: 'Pending Confirmation',
    'no-show': 'Marked as Missed (No-Show)'
  };
  const friendlyStatus = statusMap[booking.status] || booking.status;

  const subject =
    booking.status === 'cancelled'
      ? `Update on your mentorship booking (${shortRef}) — Unfoldinn`
      : `Session update for your Unfoldinn booking (${shortRef})`;

  const detailsRows = [
    { label: 'Booking Reference', value: shortRef },
    { label: 'Participant', value: booking.studentName || booking.name },
    { label: 'Current Status', value: friendlyStatus },
    { label: 'Scheduled Date & Slot', value: formattedSlot },
    { label: 'Timezone', value: timezoneLabel }
  ];

  if (hasVerifiedMeetLink && booking.status !== 'cancelled') {
    detailsRows.push({
      label: 'Google Meet Link',
      value: `<a href="${escapeHtml(booking.meetingLink)}" style="color: #B85D3B; font-weight: 700;">${escapeHtml(
        booking.meetingLink
      )}</a>`,
      isSafeHtml: true
    });
  }

  const html = renderBrandEmailLayout({
    eyebrow: 'SESSION SCHEDULE UPDATE',
    title:
      booking.status === 'cancelled'
        ? `Your Session (${shortRef}) Has Been Cancelled`
        : `Updated Details for Your Session (${shortRef})`,
    greeting: `Hello ${booking.name || booking.studentName || 'there'},`,
    introHtml:
      booking.status === 'cancelled'
        ? `<p style="margin: 0 0 12px 0;">Your mentorship booking <strong>${shortRef}</strong> has been marked as cancelled. If you would like to reschedule for another date, please reply to this email or visit your dashboard.</p>`
        : `<p style="margin: 0 0 12px 0;">There is an update to your Unfoldinn mentorship booking <strong>${shortRef}</strong>. Please review the latest schedule and session details below.</p>`,
    detailsRows,
    ctaLabel:
      hasVerifiedMeetLink && booking.status === 'confirmed'
        ? 'Join Google Meet Session'
        : 'Open Session Dashboard',
    ctaUrl:
      hasVerifiedMeetLink && booking.status === 'confirmed'
        ? booking.meetingLink
        : `${config.frontendUrl}/dashboard`
  });

  const text = [
    `Hello ${booking.name || booking.studentName || 'there'},`,
    '',
    `There is an update to your Unfoldinn mentorship booking (${shortRef}):`,
    `Status: ${friendlyStatus}`,
    `Date & Slot: ${formattedSlot}`,
    `Timezone: ${timezoneLabel}`,
    hasVerifiedMeetLink && booking.status !== 'cancelled'
      ? `Google Meet Link: ${booking.meetingLink}`
      : '',
    '',
    `View on your dashboard: ${config.frontendUrl}/dashboard`,
    '',
    'Warm regards,',
    'Deepak & Team Unfoldinn'
  ]
    .filter(Boolean)
    .join('\n');

  const signatureKey = `${booking.status}:${formattedDate}:${booking.preferredTime || ''}:${
    hasVerifiedMeetLink ? booking.meetingLink : ''
  }:${changeSummary}`;
  const hash = crypto.createHash('sha1').update(signatureKey).digest('hex').slice(0, 10);

  const promises = [];
  if (isValidEmailAddress(booking.email)) {
    promises.push(
      sendTransactionalEmail({
        workflow: 'booking_status_update',
        to: booking.email,
        subject,
        html,
        text,
        idempotencyKey: `booking_status_update:${bookingId}:${hash}`,
        metadata: { bookingId, status: booking.status, changeSummary }
      })
    );
  } else {
    promises.push(Promise.resolve({ sent: false, status: 'skipped_invalid_recipient' }));
  }

  // Also notify mentor (Deepak) on reschedule or cancellation
  const adminSubject =
    booking.status === 'cancelled'
      ? `Session cancelled (${shortRef}) — Unfoldinn`
      : `Session schedule updated (${shortRef}) — Unfoldinn`;

  const adminHtml = renderBrandEmailLayout({
    eyebrow: 'MENTOR SCHEDULE UPDATE',
    title:
      booking.status === 'cancelled'
        ? `Session Cancelled (${shortRef})`
        : `Session Rescheduled / Updated (${shortRef})`,
    greeting: 'Hello Deepak,',
    introHtml: `<p style="margin: 0 0 12px 0;">Booking <strong>${shortRef}</strong> with <strong>${escapeHtml(
      booking.name
    )}</strong> has been updated (${escapeHtml(changeSummary)}).</p>`,
    detailsRows: [
      ...detailsRows,
      { label: 'Phone / WhatsApp', value: booking.phone || 'Not provided' }
    ],
    ctaLabel: 'Open Admin Bookings',
    ctaUrl: `${config.frontendUrl}/admin/bookings`
  });

  const adminText = [
    'Hello Deepak,',
    '',
    `Booking (${shortRef}) with ${booking.name} was updated (${changeSummary}):`,
    `Status: ${friendlyStatus}`,
    `Scheduled Slot: ${formattedSlot}`,
    hasVerifiedMeetLink && booking.status !== 'cancelled'
      ? `Google Meet Link: ${booking.meetingLink}`
      : '',
    '',
    `Admin Panel: ${config.frontendUrl}/admin/bookings`
  ]
    .filter(Boolean)
    .join('\n');

  promises.push(
    sendTransactionalEmail({
      workflow: 'booking_status_update_admin',
      to: config.adminEmail,
      replyTo: isValidEmailAddress(booking.email) ? booking.email : config.replyTo,
      subject: adminSubject,
      html: adminHtml,
      text: adminText,
      idempotencyKey: `booking_status_update_admin:${bookingId}:${hash}`,
      metadata: { bookingId, status: booking.status, changeSummary }
    })
  );

  const [userRes] = await Promise.allSettled(promises);
  return userRes.status === 'fulfilled' ? userRes.value : { sent: false };
}

// ---------------------------------------------------------------------------
// 9. Post-Session Follow-Up & 7-Day Action Plan Email
//    Only sends `sharedNotes` and `actionAgreed` — NEVER private `notes`.
// ---------------------------------------------------------------------------
async function sendSevenDayFollowUpEmail(booking) {
  if (!booking || !booking.email) return { sent: false };
  if (!booking.actionAgreed && !booking.sharedNotes) return { sent: false };

  const config = getEmailConfig();
  const bookingId = String(booking._id || crypto.randomUUID());
  const shortRef = `#${bookingId.slice(-6).toUpperCase()}`;

  const subject = `Your post-session notes & 7-day action plan (${shortRef}) — Unfoldinn`;

  const followUpBlocks = [];
  if (booking.sharedNotes) {
    followUpBlocks.push(
      `<p style="margin: 0 0 8px 0;"><strong>Key Reflections Shared by Deepak:</strong></p><p style="margin: 0 0 14px 0; white-space: pre-line;">${escapeHtml(
        booking.sharedNotes
      )}</p>`
    );
  }
  if (booking.actionAgreed) {
    followUpBlocks.push(
      `<p style="margin: 0 0 8px 0;"><strong>Agreed 7-Day Action Step:</strong></p><p style="margin: 0; white-space: pre-line;">${escapeHtml(
        booking.actionAgreed
      )}</p>`
    );
  }

  const html = renderBrandEmailLayout({
    eyebrow: 'POST-SESSION FOLLOW-UP',
    title: 'Your Session Reflections & 7-Day Action Step',
    greeting: `Hello ${booking.studentName || booking.name || 'there'},`,
    introHtml: `<p style="margin: 0 0 12px 0;">Thank you for your conversation with Deepak. Here is a summary of the reflections and the 7-day action step agreed during your session.</p>`,
    detailsRows: [
      { label: 'Session Reference', value: shortRef },
      { label: 'Mentee', value: booking.studentName || booking.name },
      { label: '7-Day Check-In Status', value: booking.followUpDone ? 'Completed' : 'In Progress' }
    ],
    calloutTitle: 'Session Takeaways & Next Steps',
    calloutBodyHtml: followUpBlocks.join(''),
    closingHtml: `<p style="margin: 0;">You can reply directly to this email to share your progress with Deepak after trying out your 7-day action step.</p>`,
    ctaLabel: 'View on Dashboard',
    ctaUrl: `${config.frontendUrl}/dashboard`
  });

  const text = [
    `Hello ${booking.studentName || booking.name || 'there'},`,
    '',
    `Here are the reflections and 7-day action plan from your Unfoldinn session (${shortRef}):`,
    '',
    booking.sharedNotes ? `Key Reflections:\n${booking.sharedNotes}\n` : '',
    booking.actionAgreed ? `Agreed 7-Day Action Step:\n${booking.actionAgreed}\n` : '',
    `View your dashboard: ${config.frontendUrl}/dashboard`,
    '',
    'Warm regards,',
    'Deepak & Team Unfoldinn'
  ]
    .filter(Boolean)
    .join('\n');

  const contentHash = crypto
    .createHash('sha1')
    .update(`${booking.sharedNotes || ''}||${booking.actionAgreed || ''}`)
    .digest('hex')
    .slice(0, 10);

  return sendTransactionalEmail({
    workflow: 'booking_followup_plan',
    to: booking.email,
    subject,
    html,
    text,
    idempotencyKey: `booking_followup_plan:${bookingId}:${contentHash}`,
    metadata: { bookingId }
  });
}

// ---------------------------------------------------------------------------
// 10. Verified Payment Success Emails (User Receipt + Deepak Admin Alert)
//     Keyed by verified Cashfree `orderId` so repeated polls/webhooks deduplicate.
// ---------------------------------------------------------------------------
async function sendPaymentSuccessEmails({
  orderId,
  booking,
  subscription,
  transaction,
  user
}) {
  const config = getEmailConfig();
  const recipientEmail =
    (booking && booking.email) ||
    (user && user.email) ||
    (transaction && transaction.customerEmail) ||
    '';
  const recipientName =
    (booking && (booking.name || booking.studentName)) ||
    (user && user.name) ||
    (transaction && transaction.customerName) ||
    'Valued Member';

  const amountVal =
    (transaction && (transaction.paidAmount || transaction.expectedAmount || transaction.amount)) ||
    (booking && (booking.paymentAmount || booking.amount)) ||
    (subscription && (subscription.amountPaid || subscription.pricePaid)) ||
    0;

  const isSubscription = Boolean(subscription);
  const itemDescription = isSubscription
    ? `${subscription.planName || 'Mentorship Pack'} (${subscription.totalCredits || ''} Sessions)`
    : `1-on-1 Mentorship Session (Session #${(booking && booking.sessionNumber) || 1})`;

  const userSubject = `Payment confirmed (${orderId}) — Unfoldinn`;
  const userRows = [
    { label: 'Order Reference', value: orderId },
    { label: 'Payment Status', value: 'Paid & Verified' },
    { label: 'Amount Paid', value: `INR ${amountVal}` },
    { label: 'Plan / Session', value: itemDescription },
    {
      label: 'Date',
      value: new Date().toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  ];

  if (booking) {
    userRows.push({
      label: 'Preferred Slot',
      value: `${formatPreferredDate(booking.preferredDate)} — ${booking.preferredTime || 'Flexible'}`
    });
  }
  if (subscription) {
    userRows.push({
      label: 'Available Session Credits',
      value: `${subscription.remainingCredits ?? subscription.totalCredits - (subscription.usedCredits || 0)} of ${subscription.totalCredits} credits available`
    });
  }

  const userHtml = renderBrandEmailLayout({
    eyebrow: 'PAYMENT RECEIPT',
    title: 'Your Payment Has Been Confirmed',
    greeting: `Hello ${recipientName},`,
    introHtml: `<p style="margin: 0 0 12px 0;">Thank you for your payment. We have verified your transaction and updated your Unfoldinn account.</p>`,
    detailsRows: userRows,
    calloutTitle: isSubscription ? 'Using Your Mentorship Pack' : 'Your Session Status',
    calloutBodyHtml: isSubscription
      ? `<p style="margin: 0;">Your mentorship credits are now active! You can book 1-on-1 sessions using your pack credits directly from your dashboard.</p>`
      : `<p style="margin: 0;">Your mentorship booking is now confirmed. If you haven't selected your preferred date and time slot yet, you can pick one on the confirmation screen or in your dashboard.</p>`,
    ctaLabel: 'Go to Your Dashboard',
    ctaUrl: `${config.frontendUrl}/dashboard`
  });

  const userText = [
    `Hello ${recipientName},`,
    '',
    'Your payment with Unfoldinn has been verified.',
    `Order Reference: ${orderId}`,
    `Amount Paid: INR ${amountVal}`,
    `Item: ${itemDescription}`,
    '',
    `Access your dashboard: ${config.frontendUrl}/dashboard`,
    '',
    'Warm regards,',
    'Deepak & Team Unfoldinn'
  ].join('\n');

  const adminSubject = `Payment received: INR ${amountVal} (${orderId}) — Unfoldinn`;
  const adminRows = [
    { label: 'Order ID', value: orderId },
    { label: 'Amount Paid', value: `INR ${amountVal}` },
    { label: 'Type', value: isSubscription ? 'Subscription Pack' : '1-on-1 Session Booking' },
    { label: 'Item Details', value: itemDescription },
    { label: 'Customer Name', value: recipientName },
    { label: 'Customer Email', value: recipientEmail || 'Not available' },
    {
      label: 'Customer Phone',
      value:
        (booking && booking.phone) ||
        (user && user.phone) ||
        (transaction && transaction.customerPhone) ||
        'Not available'
    }
  ];

  const adminHtml = renderBrandEmailLayout({
    eyebrow: 'PAYMENT ALERT',
    title: `Verified Payment of INR ${amountVal}`,
    greeting: 'Hello Deepak,',
    introHtml: `<p style="margin: 0 0 12px 0;">A Cashfree payment has been verified on Unfoldinn.</p>`,
    detailsRows: adminRows,
    ctaLabel: 'Open Admin Panel',
    ctaUrl: `${config.frontendUrl}/admin`
  });

  const adminText = [
    'Hello Deepak,',
    '',
    `Verified Payment Received (${orderId}):`,
    `Amount: INR ${amountVal}`,
    `Item: ${itemDescription}`,
    `Customer: ${recipientName} (${recipientEmail || 'N/A'})`,
    '',
    `Admin Panel: ${config.frontendUrl}/admin`
  ].join('\n');

  const promises = [];
  if (isValidEmailAddress(recipientEmail)) {
    promises.push(
      sendTransactionalEmail({
        workflow: 'payment_success_user',
        to: recipientEmail,
        subject: userSubject,
        html: userHtml,
        text: userText,
        idempotencyKey: `payment_success_user:${orderId}`,
        metadata: { orderId, amount: amountVal }
      })
    );
  } else {
    promises.push(Promise.resolve({ sent: false, status: 'skipped_invalid_recipient' }));
  }

  promises.push(
    sendTransactionalEmail({
      workflow: 'payment_success_admin',
      to: config.adminEmail,
      replyTo: isValidEmailAddress(recipientEmail) ? recipientEmail : config.replyTo,
      subject: adminSubject,
      html: adminHtml,
      text: adminText,
      idempotencyKey: `payment_success_admin:${orderId}`,
      metadata: { orderId, amount: amountVal }
    })
  );

  const [userRes, adminRes] = await Promise.allSettled(promises);
  return {
    userEmail: userRes.status === 'fulfilled' ? userRes.value : { sent: false },
    adminEmail: adminRes.status === 'fulfilled' ? adminRes.value : { sent: false }
  };
}

// ---------------------------------------------------------------------------
// 11. Payment Failure Notification Email
// ---------------------------------------------------------------------------
async function sendPaymentFailedEmail({ orderId, booking, transaction, user }) {
  const config = getEmailConfig();
  const recipientEmail =
    (booking && booking.email) ||
    (user && user.email) ||
    (transaction && transaction.customerEmail) ||
    '';
  if (!isValidEmailAddress(recipientEmail)) {
    return { sent: false, status: 'skipped_invalid_recipient' };
  }

  const recipientName =
    (booking && (booking.name || booking.studentName)) ||
    (user && user.name) ||
    (transaction && transaction.customerName) ||
    'there';
  const amountVal =
    (transaction && (transaction.expectedAmount || transaction.amount)) ||
    (booking && (booking.paymentAmount || booking.amount)) ||
    '';

  const subject = `Payment could not be completed (${orderId}) — Unfoldinn`;
  const html = renderBrandEmailLayout({
    eyebrow: 'PAYMENT UPDATE',
    title: 'Your Payment Could Not Be Completed',
    greeting: `Hello ${recipientName},`,
    introHtml: `<p style="margin: 0 0 12px 0;">We noticed that your recent payment attempt on Unfoldinn did not go through. No confirmed charge was applied to your booking.</p>`,
    detailsRows: [
      { label: 'Order Reference', value: orderId },
      { label: 'Amount', value: amountVal ? `INR ${amountVal}` : 'As selected' },
      { label: 'Status', value: 'Payment Unsuccessful' }
    ],
    calloutTitle: 'How to Complete Your Booking',
    calloutBodyHtml: `<p style="margin: 0;">You can retry the payment anytime from your Unfoldinn booking page or reach out to us by replying to this email if you need assistance.</p>`,
    ctaLabel: 'Retry Booking on Unfoldinn',
    ctaUrl: `${config.frontendUrl}/book`
  });

  const text = [
    `Hello ${recipientName},`,
    '',
    `Your recent payment attempt (${orderId}) on Unfoldinn could not be completed.`,
    `You can retry anytime at: ${config.frontendUrl}/book`,
    '',
    'If any amount was debited by your bank, it is typically auto-refunded within 5-7 business days.',
    '',
    'Warm regards,',
    'Deepak & Team Unfoldinn'
  ].join('\n');

  return sendTransactionalEmail({
    workflow: 'payment_failed_user',
    to: recipientEmail,
    subject,
    html,
    text,
    idempotencyKey: `payment_failed_user:${orderId}`,
    metadata: { orderId }
  });
}

module.exports = {
  getEmailConfig,
  isValidEmailAddress,
  sendTransactionalEmail,
  sendEmailOtp,
  sendWelcomeEmail,
  sendContactEmails,
  sendInstitutionEnquiryEmails,
  sendSupportTicketEmails,
  sendNewsletterWelcomeEmail,
  sendBookingConfirmationEmails,
  sendBookingStatusUpdateEmail,
  sendSevenDayFollowUpEmail,
  sendPaymentSuccessEmails,
  sendPaymentFailedEmail
};
