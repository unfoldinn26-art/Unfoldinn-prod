import Image from 'next/image';
import Link from 'next/link';
import PageHero from '../../components/ui/PageHero';

export const metadata = {
  title: 'Aman Pratap Singh — Platform Architecture & Engineering | Unfoldinn',
  description:
    'Full-stack architecture, distributed concurrency engineering, defense-in-depth security, and regulatory compliance crafted by Aman Pratap Singh for Unfoldinn.',
  alternates: {
    canonical: 'https://www.unfoldinn.com/made-by-aman',
  },
  openGraph: {
    title: 'Aman Pratap Singh — Platform Architecture & Engineering | Unfoldinn',
    description:
      'A complete technical overview of the full-stack engineering, high-concurrency architecture, security posture, and regulatory compliance behind Unfoldinn, built by Aman Pratap Singh.',
    url: 'https://www.unfoldinn.com/made-by-aman',
    images: [
      {
        url: 'https://www.unfoldinn.com/aman-pratap-singh.jpg',
        width: 882,
        height: 963,
        alt: 'Aman Pratap Singh — Lead Full-Stack Engineer & System Architect of Unfoldinn',
      },
    ],
  },
};

const technicalSections = [
  {
    number: '01',
    title: 'Domain, Anycast DNS & Edge Network',
    tag: 'Edge Infrastructure',
    items: [
      'Custom Primary Domain & Canonical Routing (unfoldinn.com)',
      'Cloudflare Global Anycast DNS & Nameservers',
      'DNS Records Architecture (A, CNAME, TXT, MX)',
      'DNSSEC Cryptographic Signing & Verification',
      'WHOIS / RDAP Privacy Protection',
      'Domain Transfer Lock & Automated Renewal Safeguards',
    ],
  },
  {
    number: '02',
    title: 'Cloud Hosting & CI/CD Deployment',
    tag: 'Cloud & Delivery',
    items: [
      'Frontend Hosting on Vercel Global Edge Network',
      'Dedicated Cloud Backend API Server',
      'Neon Serverless PostgreSQL 18 (ACID Primary Ledger) & Redis Cloud In-Memory Store',
      'GitHub Automated CI/CD Production & Preview Pipelines',
      'Isolated Production & Preview Environments',
      'Zero-Downtime Automated SSL/TLS Certificates',
    ],
  },
  {
    number: '03',
    title: 'DNS & Network Security',
    tag: 'Perimeter Defense',
    items: [
      'Cloudflare Edge Proxy & L3/L4/L7 DDoS Mitigation',
      'End-to-End SSL/TLS Encryption & Automatic HTTPS Enforcement',
      'HTTP Strict Transport Security (HSTS Preload)',
      'Enforced Content Security Policy (CSP)',
      'Strict Cross-Origin Resource Sharing (CORS) Origin Whitelist',
      'Edge Firewall Filtering & Trusted Proxy IP Forwarding',
    ],
  },
  {
    number: '04',
    title: 'Frontend Engineering & Design System',
    tag: 'User Interface',
    items: [
      'Next.js App Router (Server & Client Components)',
      'React Component Architecture & Modern JavaScript (ES6+)',
      'Semantic HTML5, CSS3 & Tailwind CSS Editorial Design System',
      'Adaptive Dark / Light Theme Engine with Zero-Flash Hydration',
      'Responsive Mobile-First Typography & Layout',
      'Resilient API Layer with Safe JSON Parsing & Automatic Cold-Start Recovery',
      'Next.js Image Optimization (WebP / AVIF) & Progressive Web App Manifest',
    ],
  },
  {
    number: '05',
    title: 'Backend Systems & API Architecture',
    tag: 'Core Server',
    items: [
      'Node.js & Express.js RESTful API Architecture',
      'Stateless Token Authentication & Role-Based Authorization',
      'Strict Payload Whitelisting & Input Validation (Mass-Assignment Prevention)',
      'Multi-Tier Traffic Rate Limiting Across Public, Auth & Payment Routes',
      'Fast-Fail Database Reconnect Guard with Graceful Retry Signaling',
      'Helmet Security Middleware & Sanitized Production Error Handling',
    ],
  },
  {
    number: '06',
    title: 'Elephant & Goldfish Database & High-Concurrency Engineering',
    tag: 'Distributed Consistency',
    items: [
      'Neon PostgreSQL 18 + Prisma ORM (The Elephant: ACID Relational Ledger & Decimal(12,2) Financial Precision)',
      'Redis Cloud In-Memory Layer (The Goldfish: Sub-ms Tokenized Slot Holds, Hashed OTPs & Hot Cache)',
      'Native PostgreSQL btree_gist Exclusion Constraints Preventing Overlapping Session Windows',
      'Lua Compare-and-Delete (CAD) Lock Release & 5-Attempt Atomic OTP Self-Destruct Scripts',
      'Cryptographic Idempotency Keys & Request Fingerprint Deduplication',
      'Atomic Multi-Tab Complimentary Session Claim Protection',
      'Append-Only Subscription Credit & Coupon Redemption Ledgers with Database CHECK Constraints',
      'Standalone AES-256-GCM Encrypted pg_dump Disaster-Recovery Vault with Automated Restore Verification',
    ],
  },
  {
    number: '07',
    title: 'Authentication, Identity & Bot Defense',
    tag: 'Identity & Access',
    items: [
      'Google OAuth 2.0 Sign-In with Cryptographic ID Token Verification',
      'Email + Password Login with Mandatory 2-Factor Email OTP (2FA)',
      'Passwordless Email OTP Registration & Sign-In',
      'Cryptographic Password Hashing & HMAC-SHA256 Hashed OTP Storage',
      'Constant-Time Hash Comparison & Atomic OTP Attempt Self-Destruct',
      'Google reCAPTCHA v2 Integration Across Public & Admin Flows',
      'Behavioral Honeypot Bot Traps & Automated Threat Quarantine',
      'Atomic Brute-Force Account Lockout & Active Session Revocation',
    ],
  },
  {
    number: '08',
    title: 'Payment Gateway, Subscriptions & Coupons',
    tag: 'Financial Systems',
    items: [
      'Cashfree Payments Gateway Integration (Single Sessions, Subscriptions & Support)',
      'Complimentary Introductory Session Eligibility Engine',
      'Dynamic Promo & Coupon Engine (Percentage, Flat & 100% Fee Waivers)',
      'Server-Side Price Calculation & Amount Tamper Protection',
      'Raw-Body HMAC-SHA256 Webhook Signature Verification & Replay Deduplication',
      'Atomic Verify-vs-Webhook Reconciliation (Strictly-Once Fulfillment)',
      'Automated Pre-Checkout Payment Status Reconciliation & Transaction Ledger',
    ],
  },
  {
    number: '09',
    title: 'Transactional Email & Notification Architecture',
    tag: 'Communications',
    items: [
      'Resend HTTP API with Nodemailer SMTP Failover',
      'Custom Domain Email Authentication (SPF, DKIM & DMARC)',
      'Instant OTP & 2-Factor Verification Emails',
      'Automated Booking Confirmation, Reschedule & Cancellation Emails',
      '7-Day Post-Session Student Follow-Up Emails',
      'Verifiable Under-18 Parental Consent Notification Emails',
      'Real-Time Automated Security & Lockout Alert Emails',
    ],
  },
  {
    number: '10',
    title: 'Google Workspace & AI Capabilities',
    tag: 'Integrations & AI',
    items: [
      'Google Cloud Console & OAuth 2.0 Integration',
      'Automated Google Calendar Event Creation, Rescheduling & Cancellation',
      'Automated Unique Google Meet Video Link Provisioning',
      '1-Click .ics Calendar File Export & WhatsApp Session Sharing',
      'Consent-Gated AI Post-Session Summary & Reflection Note Generator',
      'Google Analytics 4 & Google Search Console Telemetry',
    ],
  },
  {
    number: '11',
    title: 'Application Security Hardening',
    tag: 'Defense-in-Depth',
    items: [
      'Enforced HTTP Security Headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)',
      'Recursive NoSQL Injection & Prototype Pollution Sanitization',
      'Cross-Site Scripting (XSS) & Cross-Site Request Forgery (CSRF) Safeguards',
      'Production Database & Stack-Trace Error Masking',
      'Strict Environment Variable & Cryptographic Secret Isolation',
      'Automated Dependency & Vulnerability Auditing',
    ],
  },
  {
    number: '12',
    title: 'Indian Legal & Regulatory Compliance Engineering',
    tag: 'Privacy & Law',
    items: [
      'Digital Personal Data Protection (DPDP) Act, 2023 & DPDP Rules, 2025 Alignment',
      'Explicit Itemised Consent Notice & Cryptographic Consent Audit Timestamps',
      'Section 9 Verifiable Under-18 Parental Consent Workflow',
      'Section 11 Right to Access: 1-Click Portable JSON Personal Data Export',
      'Section 12 Right to Erasure: 1-Click Self-Service Permanent Account Erasure',
      'CCPA Dark Patterns Guidelines, 2023 Compliance (Zero Pre-Ticked Boxes or Hidden Fees)',
      'Consumer Protection (E-Commerce) Rules, 2020 & IT Rules, 2021 Grievance Redressal',
      'Mental Healthcare Act, 2017 Non-Clinical Scope & 24x7 National Helpline Disclosures',
    ],
  },
  {
    number: '13',
    title: 'SEO, Knowledge Graph & Performance',
    tag: 'Discovery & Speed',
    items: [
      'Unified Canonical & OpenGraph Metadata Architecture Across All Routes',
      'Dynamic XML Sitemap (sitemap.xml), Robots Control (robots.txt) & LLM Index (llms.txt)',
      'Schema.org JSON-LD Knowledge Graph (EducationalOrganization & Person)',
      'Edge CDN Caching, Static Asset Compression & Code Splitting',
      'Core Web Vitals & Mobile Interaction Optimization',
    ],
  },
  {
    number: '14',
    title: 'Development, Testing & Version Control',
    tag: 'Engineering Quality',
    items: [
      'Git & GitHub Version Control with Branch & Release Management',
      'ESLint Static Analysis & Production Build Verification',
      '1,000-Parallel-Task Concurrency & Adversarial Stress Benchmarking',
      'Zero-Race-Condition Verification Across OTPs, Slot Locks, Credits & Webhooks',
    ],
  },
  {
    number: '15',
    title: 'Observability, Monitoring & Technology Ecosystem',
    tag: 'Operations',
    items: [
      'Live API, Neon PostgreSQL & Redis Cloud Readiness Health Endpoints',
      'Cloudflare, Vercel, Render, Neon PostgreSQL & Redis Cloud Telemetry',
      'Cashfree Payments, Resend & Google Cloud Platform Integrations',
      'Automated Nightly AES-256-GCM Encrypted Disaster-Recovery Backups & 30-Day Retention',
    ],
  },
];

export default function MadeByAmanPage() {
  return (
    <div className="w-full">
      <PageHero
        breadcrumbs={[{ name: 'Made by Aman Pratap Singh', href: '/made-by-aman' }]}
        meta={['Full-Stack Engineering', 'Security & Concurrency', 'System Architecture']}
        title="Architected &amp; engineered by Aman Pratap Singh."
        lede="A complete technical overview of the full-stack architecture, high-concurrency state machines, defense-in-depth security, and regulatory compliance powering Unfoldinn."
      />

      <div className="page-x py-10 sm:py-16 md:py-24 max-w-[76rem]">
        {/* Architect Profile Card */}
        <section className="mb-12 sm:mb-16 overflow-hidden rounded-[1.25rem] sm:rounded-[1.75rem] border border-line bg-paper-2 p-6 sm:p-8 md:p-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center">
            <div className="md:col-span-4 lg:col-span-3">
              <div className="relative mx-auto aspect-[4/4.3] w-full max-w-[260px] overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
                <Image
                  src="/aman-pratap-singh.jpg"
                  alt="Aman Pratap Singh — Full-Stack Architect & Engineer of Unfoldinn"
                  fill
                  sizes="(max-width: 768px) 260px, 280px"
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>

            <div className="space-y-4 md:col-span-8 lg:col-span-9">
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1">
                <span className="h-2 w-2 rounded-full bg-signal" />
                <span className="font-mono text-[0.75rem] uppercase tracking-wider text-ink">
                  Platform Architect &amp; Lead Full-Stack Engineer
                </span>
              </div>

              <h2 className="font-serif text-[2rem] sm:text-[2.5rem] leading-tight text-ink">
                Aman Pratap Singh
              </h2>

              <p className="max-w-[64ch] text-[1rem] sm:text-[1.0625rem] leading-relaxed text-ink-2">
                Designed, engineered, and hardened the complete Unfoldinn digital ecosystem from the ground up — combining editorial frontend craftsmanship with distributed high-concurrency state machines, cryptographic payment &amp; OTP verification, automated Google Workspace scheduling, and full Indian DPDP Act compliance.
              </p>

              {/* Key Engineering Metrics */}
              <div className="grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
                <div>
                  <span className="font-mono text-[0.7rem] uppercase tracking-wider text-signal">Architecture</span>
                  <p className="font-serif text-xl sm:text-2xl text-ink">15 Core Layers</p>
                  <p className="text-xs text-muted">Edge, UI, API, DB &amp; AI</p>
                </div>
                <div>
                  <span className="font-mono text-[0.7rem] uppercase tracking-wider text-signal">Concurrency</span>
                  <p className="font-serif text-xl sm:text-2xl text-ink">1,000+ Parallel</p>
                  <p className="text-xs text-muted">Zero-race atomic locks</p>
                </div>
                <div>
                  <span className="font-mono text-[0.7rem] uppercase tracking-wider text-signal">Security</span>
                  <p className="font-serif text-xl sm:text-2xl text-ink">Defense-in-Depth</p>
                  <p className="text-xs text-muted">2FA, OAuth 2.0, CSP &amp; HMAC</p>
                </div>
                <div>
                  <span className="font-mono text-[0.7rem] uppercase tracking-wider text-signal">Compliance</span>
                  <p className="font-serif text-xl sm:text-2xl text-ink">DPDP 2023 &amp; 2025</p>
                  <p className="text-xs text-muted">Export, erasure &amp; consent</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 15 Technical Categories Grid */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
          {technicalSections.map((section) => (
            <section
              key={section.number}
              className="flex flex-col justify-between rounded-[1.25rem] sm:rounded-[1.5rem] border border-line bg-paper-2 p-6 sm:p-8 transition-colors hover:border-ink/30"
            >
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-medium tracking-widest text-signal uppercase">
                    {section.number} / {section.tag}
                  </span>
                </div>
                <h2 className="mb-4 font-serif text-[1.35rem] sm:text-[1.6rem] leading-snug text-ink">
                  {section.title}
                </h2>
                <ul className="space-y-2.5 text-[0.9375rem] leading-relaxed text-ink-2">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 sm:mt-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-line pt-8">
          <div>
            <p className="font-serif text-xl text-ink">Engineered with precision by Aman Pratap Singh.</p>
            <p className="text-sm text-muted">
              Every layer is built to keep student conversations private, reliable, and effortless.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-2 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            ← Back to Unfoldinn
          </Link>
        </div>
      </div>
    </div>
  );
}
