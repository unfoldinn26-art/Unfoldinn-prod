const https = require('https');

/**
 * Normalize an Indian or international phone string to a clean 10-digit number
 */
function normalizePhone10(rawPhone) {
  const digits = String(rawPhone || '').replace(/[^0-9]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits.slice(-10);
}

/**
 * Helper to make HTTPS JSON POST/GET requests without extra dependencies
 */
function httpsRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(raw) });
        } catch {
          resolve({ statusCode: res.statusCode, data: raw });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Send 6-Digit Phone OTP via configured SMS Gateway:
 * 1. 2Factor.in (TWO_FACTOR_API_KEY)
 * 2. Fast2SMS (FAST2SMS_API_KEY)
 * 3. Twilio SMS (TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER)
 */
async function sendPhoneOtpSms({ phone, otpCode }) {
  const cleanPhone = normalizePhone10(phone);
  if (cleanPhone.length !== 10) {
    throw new Error('Please enter a valid 10-digit mobile number.');
  }

  // Option 1: 2Factor.in SMS OTP API
  if (process.env.TWO_FACTOR_API_KEY) {
    const apiKey = process.env.TWO_FACTOR_API_KEY.trim();
    const url = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/+91${cleanPhone}/${encodeURIComponent(otpCode)}/UnfoldinnOTP`;
    const resp = await httpsRequest(url, { method: 'GET' });
    if (resp.statusCode >= 200 && resp.statusCode < 300) {
      return { delivered: true, mode: '2factor_sms' };
    }
    console.warn('2Factor SMS response warning:', resp.data);
  }

  // Option 2: Fast2SMS OTP / Quick SMS API
  if (process.env.FAST2SMS_API_KEY) {
    const apiKey = process.env.FAST2SMS_API_KEY.trim();
    const payload = {
      route: 'q',
      message: `Your Unfoldinn verification OTP is ${otpCode}. Valid for 10 minutes. Do not share this code.`,
      language: 'english',
      flash: 0,
      numbers: cleanPhone
    };
    const resp = await httpsRequest(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json'
        }
      },
      payload
    );
    if (resp.statusCode >= 200 && resp.statusCode < 300 && resp.data?.return !== false) {
      return { delivered: true, mode: 'fast2sms' };
    }
    console.warn('Fast2SMS response warning:', resp.data);
  }

  // Option 3: Twilio SMS API
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    const sid = process.env.TWILIO_ACCOUNT_SID.trim();
    const token = process.env.TWILIO_AUTH_TOKEN.trim();
    const fromPhone = process.env.TWILIO_PHONE_NUMBER.trim();
    const formBody = new URLSearchParams({
      To: `+91${cleanPhone}`,
      From: fromPhone,
      Body: `Your Unfoldinn verification code is ${otpCode}. Valid for 10 minutes.`
    }).toString();

    const resp = await httpsRequest(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      },
      formBody
    );
    if (resp.statusCode >= 200 && resp.statusCode < 300) {
      return { delivered: true, mode: 'twilio_sms' };
    }
    console.warn('Twilio SMS response warning:', resp.data);
  }

  // Fallback when SMS gateway API key is not configured yet
  console.log('\n======================================================');
  console.log(`[UNFOLDINN PHONE OTP] Mobile: +91 ${cleanPhone}`);
  console.log(`[UNFOLDINN PHONE OTP] 6-Digit Code: ${otpCode}`);
  console.log('======================================================\n');
  return { delivered: false, mode: 'console_preview' };
}

function isSmsGatewayConfigured() {
  return Boolean(
    (process.env.TWO_FACTOR_API_KEY && process.env.TWO_FACTOR_API_KEY.trim()) ||
    (process.env.FAST2SMS_API_KEY && process.env.FAST2SMS_API_KEY.trim()) ||
    (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
  );
}

module.exports = {
  normalizePhone10,
  sendPhoneOtpSms,
  isSmsGatewayConfigured
};
