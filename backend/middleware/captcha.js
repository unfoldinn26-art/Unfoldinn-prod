/**
 * Google reCAPTCHA v2 Verification Middleware
 * Validates 'I am not a robot' token against Google's SiteVerify API
 */
const verifyCaptcha = async (req, res, next) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // If secret key is not configured, bypass gracefully (useful in test environments)
  if (!secretKey) {
    return next();
  }

  const token = req.body.captchaToken || req.headers['x-captcha-token'];

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Please complete the "I am not a robot" checkbox before submitting.'
    });
  }

  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
      remoteip: req.ip || ''
    });

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const result = await response.json();

    if (!result.success) {
      console.warn('Google reCAPTCHA verification failed:', result['error-codes'] || result);
      return res.status(400).json({
        success: false,
        error: 'CAPTCHA verification failed. Please tick "I am not a robot" again.'
      });
    }

    // Verification passed
    next();
  } catch (err) {
    console.error('CAPTCHA verification network error:', err.message);
    // Fail-safe: don't permanently block legitimate users during temporary Google outages
    next();
  }
};

module.exports = { verifyCaptcha };
