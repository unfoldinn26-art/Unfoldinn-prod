/** @type {import('next').NextConfig} */

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
let apiOrigin = 'https://unfoldinn-prod-5689clickcore.vercel.app';
try {
  apiOrigin = new URL(apiUrl).origin;
} catch {
  // Fallback if NEXT_PUBLIC_API_URL is relative or malformed
}

const isDev = process.env.NODE_ENV !== 'production';

// SHA-256 hash of the inline theme initialization script in app/layout.js
const THEME_SCRIPT_HASH = "'sha256-zSsb2AaG66ILpG+Yf9BOoCl9TgjhESipos0G2HrIYb4='";

const connectSrcOrigins = Array.from(
  new Set([
    "'self'",
    ...(apiOrigin.startsWith('https://') || isDev ? [apiOrigin] : []),
    'https://unfoldinn-prod-5689clickcore.vercel.app',
    ...(isDev ? ['http://localhost:5000'] : []),
    'https://accounts.google.com',
    'https://www.google.com',
    'https://sdk.cashfree.com',
    'https://api.cashfree.com',
    'https://sandbox.cashfree.com',
    'https://payments.cashfree.com',
    'https://payments-test.cashfree.com',
  ])
).join(' ');

const cspReportOnlyDirectives = [
  "default-src 'self'",
  `script-src 'self' ${THEME_SCRIPT_HASH} https://accounts.google.com https://www.google.com https://www.gstatic.com https://sdk.cashfree.com`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://www.gstatic.com",
  "font-src 'self' data:",
  `connect-src ${connectSrcOrigins}`,
  "frame-src 'self' https://accounts.google.com https://www.google.com https://recaptcha.google.com https://sdk.cashfree.com https://api.cashfree.com https://payments.cashfree.com https://payments-test.cashfree.com",
  "form-action 'self' https://api.cashfree.com https://payments.cashfree.com https://payments-test.cashfree.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(!isDev ? ['upgrade-insecure-requests'] : []),
].join('; ');

const nextConfig = {
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: cspReportOnlyDirectives,
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
