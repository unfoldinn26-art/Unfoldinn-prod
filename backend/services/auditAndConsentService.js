const crypto = require('crypto');
const { prisma } = require('../config/prisma');

/**
 * Hash IP address with HMAC-SHA256 so we never retain raw student/minor IPs unnecessarily
 */
function hashClientIp(ip) {
  if (!ip) return null;
  const secret = process.env.JWT_SECRET || 'unfoldinn-ip-privacy-salt';
  return crypto.createHmac('sha256', secret).update(`ip:${String(ip).trim()}`).digest('hex').slice(0, 32);
}

/**
 * Append an immutable AuditLog entry in Neon PostgreSQL
 */
async function recordAuditLog({
  actorId = null,
  actorRole = 'system',
  actorType = null,
  action,
  entityType,
  entityId = null,
  beforeState = null,
  afterState = null,
  ip = null,
  userAgent = null,
  metadata = null,
  tx = null
}) {
  const client = tx || prisma;
  try {
    return await client.auditLog.create({
      data: {
        actorId: actorId ? String(actorId) : null,
        actorRole: String(actorType || actorRole || 'system').toLowerCase(),
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        beforeState: beforeState || undefined,
        afterState: afterState || undefined,
        ipHash: hashClientIp(ip),
        userAgent: userAgent ? String(userAgent).slice(0, 255) : null,
        metadata: metadata || undefined
      }
    });
  } catch (err) {
    console.warn('[AuditLog Write Notice]:', err.message);
    return null;
  }
}

/**
 * Record versioned legal consent evidence (DPDP Privacy Notice, Under-18 Parental Consent, AI Session Notes)
 */
async function recordConsentEvidence({
  userId,
  bookingId = null,
  consentType,
  noticeVersion = '2026.1',
  purpose = 'DPDP Act 2023 & 2025 Rules Affirmative Consent',
  granted = true,
  parentName = null,
  parentEmail = null,
  parentPhone = null,
  parentRelation = null,
  verificationMethod = 'EXPLICIT_OPT_IN_CHECKBOX',
  ip = null,
  userAgent = null,
  tx = null
}) {
  if (!userId) return null;
  const client = tx || prisma;
  const timestampIso = new Date().toISOString();
  const evidenceHash = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        userId,
        bookingId,
        consentType,
        noticeVersion,
        purpose,
        granted,
        parentEmail,
        verificationMethod,
        timestampIso
      })
    )
    .digest('hex');

  try {
    return await client.consentRecord.create({
      data: {
        userId: String(userId),
        bookingId: bookingId ? String(bookingId) : null,
        consentType,
        noticeVersion,
        purpose,
        granted: Boolean(granted),
        parentName,
        parentEmail,
        parentPhone,
        parentRelation,
        verificationMethod,
        evidenceHash,
        ipHash: hashClientIp(ip),
        userAgentSummary: userAgent ? String(userAgent).slice(0, 200) : null
      }
    });
  } catch (err) {
    console.warn('[ConsentRecord Write Notice]:', err.message);
    return null;
  }
}

module.exports = {
  hashClientIp,
  recordAuditLog,
  writeAuditLog: recordAuditLog,
  recordConsentEvidence,
  writeConsentRecord: recordConsentEvidence
};
