'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useInView,
} from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Cpu,
  Database,
  FileCheck2,
  Globe,
  Layers,
  Lock,
  Mail,
  Search,
  Server,
  Shield,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

const FLOW_NODES = [
  {
    id: 'edge',
    step: '01',
    label: 'Cloudflare Edge',
    metric: '< 12ms TLS',
    subtitle: 'WAF, Turnstile & DNSSEC',
    icon: Globe,
    telemetry:
      'Terminates TLS 1.3 at the nearest PoP, enforces WAF rules, and validates Turnstile challenge tokens before a single byte reaches origin compute.',
    trace: [
      'TLSv1.3 / HSTS-Preload · Verified',
      'CF-Turnstile-Token · Challenge Passed',
      'WAF Ruleset · 0 Anomalies · Forward → Origin',
    ],
  },
  {
    id: 'api',
    step: '02',
    label: 'Next.js + Express',
    metric: 'Zod Strict',
    subtitle: 'SSR, Fail-Closed Auth & RBAC',
    icon: Server,
    telemetry:
      'Next.js 14 App Router pairs with a stateless Express REST API. Every mutation is validated via Zod schemas with fail-closed JWT/OTP verification.',
    trace: [
      'POST /api/bookings/checkout · Schema Validated',
      'Auth Middleware · HTTP-Only Session Verified',
      'Idempotency-Key · Checked · Dispatch → Goldfish',
    ],
  },
  {
    id: 'goldfish',
    step: '03',
    label: 'Goldfish (Redis)',
    metric: '0.4ms Lock',
    subtitle: 'Distributed Locks & Rate Limits',
    icon: Zap,
    telemetry:
      'Redis Cloud handles atomic slot locking, sliding-window rate limiting, and OTP state so 1,000+ concurrent users never double-book a mentor slot.',
    trace: [
      'SET lock:slot:2026-11-13:1600 NX EX 300 → OK',
      'ZREMRANGEBYSCORE ratelimit:ip · 4/60 req/min',
      'Cache-Control · Hot Availability Served in 0.4ms',
    ],
  },
  {
    id: 'elephant',
    step: '04',
    label: 'Elephant (Postgres 18)',
    metric: 'ACID Ledger',
    subtitle: 'Neon PostgreSQL + Prisma ORM',
    icon: Database,
    telemetry:
      'Neon PostgreSQL 18 via Prisma ORM persists ACID-compliant bookings, Razorpay payment ledgers, messages, reviews, and immutable audit logs.',
    trace: [
      'BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE',
      'INSERT INTO bookings (...) ON CONFLICT DO NOTHING',
      'COMMIT · Ledger & Credit Balance Synced',
    ],
  },
  {
    id: 'vault',
    step: '05',
    label: 'Encrypted DR Vault',
    metric: 'AES-256-GCM',
    subtitle: 'Signed Snapshots & Restore Audit',
    icon: Lock,
    telemetry:
      'Automated disaster-recovery snapshots are compressed, encrypted with AES-256-GCM, hashed with SHA-256, and gated behind admin audit trails.',
    trace: [
      'Snapshot Dump · 42 Tables Exported Cleanly',
      'Cipher · AES-256-GCM + AuthTag Generated',
      'Digest · SHA-256 Verified · Stored in Vault',
    ],
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All 15 Layers', count: 15 },
  { id: 'infra', label: 'Edge & Cloud', count: 3 },
  { id: 'data', label: 'Data & Concurrency', count: 3 },
  { id: 'security', label: 'Security & DPDP', count: 4 },
  { id: 'product', label: 'Product & AI', count: 5 },
];

const TECHNICAL_LAYERS = [
  {
    id: '01',
    cat: 'infra',
    featured: false,
    icon: Globe,
    title: 'Edge Infrastructure & DNS',
    summary:
      'Zero-trust edge routing, DNSSEC, HSTS preload, and DDoS mitigation protecting every endpoint before origin compute.',
    bullets: [
      'Full Strict SSL/TLS 1.3 encryption with edge caching',
      'DNSSEC + CAA records locking certificate issuance',
    ],
    invariant: 'No plaintext HTTP or unverified origin IP exposure.',
    stack: ['Cloudflare', 'DNSSEC', 'TLS 1.3'],
  },
  {
    id: '02',
    cat: 'infra',
    featured: false,
    icon: Cloud,
    title: 'Cloud & Delivery',
    summary:
      'Split-origin production topology with globally distributed frontend edge nodes and isolated backend compute.',
    bullets: [
      'Zero-downtime rolling deployments with health gates',
      'Immutable static asset caching and Brotli delivery',
    ],
    invariant: 'Frontend and API scale and deploy independently.',
    stack: ['Vercel', 'Render', 'Edge CDN'],
  },
  {
    id: '03',
    cat: 'security',
    featured: false,
    icon: Shield,
    title: 'Perimeter Defense',
    summary:
      'Bot-resistant signup, login, and booking flows paired with strict origin allowlists blocking automated abuse.',
    bullets: [
      'Cloudflare Turnstile verification on public forms',
      'Strict CORS allowlists and security response headers',
    ],
    invariant: 'Unverified origins and bot bursts drop at the edge.',
    stack: ['Cloudflare WAF', 'Turnstile', 'CORS'],
  },
  {
    id: '04',
    cat: 'product',
    featured: false,
    icon: Sparkles,
    title: 'Editorial User Interface',
    summary:
      'Warm, human-first mentoring interface engineered for calm clarity, AAA contrast, and reduced-motion aware interaction.',
    bullets: [
      'Mocha, champagne, and burnt-amber tokens calibrated for AAA legibility',
      'Accessible keyboard navigation and responsive mobile-first layouts',
    ],
    invariant: 'Zero layout shift during auth or booking state updates.',
    stack: ['Next.js 14', 'Tailwind', 'Framer Motion'],
  },
  {
    id: '05',
    cat: 'infra',
    featured: false,
    icon: Cpu,
    title: 'Core Application Server',
    summary:
      'Stateless REST API engineered for predictable latency, strict boundary validation, and clean failure isolation.',
    bullets: [
      'Zod request validation rejecting malformed payloads early',
      'Structured JSON logging and deterministic error codes',
    ],
    invariant: 'All external inputs are untrusted until schema-parsed.',
    stack: ['Node.js', 'Express', 'Zod'],
  },
  {
    id: '06',
    cat: 'data',
    featured: true,
    icon: Database,
    title: 'Elephant & Goldfish Engine',
    summary:
      'Dual-engine persistence pairing Neon PostgreSQL 18 ACID relational integrity with sub-millisecond Redis Cloud distributed locks for 1,000+ parallel sessions.',
    bullets: [
      'Elephant (PostgreSQL 18 + Prisma) for bookings, ledgers, messages, and reviews',
      'Goldfish (Redis Cloud) for atomic NX slot locks, OTP state, and rate limiting',
    ],
    invariant: 'Two users can never claim the same mentor slot simultaneously.',
    stack: ['PostgreSQL 18', 'Redis Cloud', 'Prisma ORM'],
  },
  {
    id: '07',
    cat: 'security',
    featured: false,
    icon: Lock,
    title: 'Auth & Bot Defense',
    summary:
      'Multi-factor account flows with Google OAuth, Email OTP verification, and zero-flicker sign-in UX.',
    bullets: [
      'Fail-closed JWT verification and HTTP-only session cookies',
      'Constant-time token checks and brute-force lockouts',
    ],
    invariant: 'Auth state never silently degrades to unauthenticated access.',
    stack: ['Google OAuth', 'Email OTP', 'JWT'],
  },
  {
    id: '08',
    cat: 'product',
    featured: true,
    icon: Layers,
    title: 'Payments & Session Ledger',
    summary:
      'Idempotent Razorpay checkout supporting single sessions, multi-packs, and monthly subscriptions with HMAC-SHA256 verified webhooks and admin refunds.',
    bullets: [
      'Cryptographic HMAC-SHA256 signature verification on all webhooks',
      'Atomic credit allocation and admin-audited refund workflows',
    ],
    invariant: 'Duplicate webhook deliveries never double-credit an account.',
    stack: ['Razorpay', 'HMAC-SHA256', 'Webhooks'],
  },
  {
    id: '09',
    cat: 'product',
    featured: false,
    icon: Mail,
    title: 'Transactional Messaging',
    summary:
      'Reliable email notifications, booking confirmations, and 1:1 mentor-student messaging threads.',
    bullets: [
      'Authenticated DKIM/SPF transactional delivery via Resend',
      'In-app notification center and unread thread tracking',
    ],
    invariant: 'Critical booking emails retry cleanly without blocking checkout.',
    stack: ['Resend', 'DKIM/SPF', 'In-App Chat'],
  },
  {
    id: '10',
    cat: 'product',
    featured: false,
    icon: Activity,
    title: 'Google Workspace & Meet',
    summary:
      'Automated session scheduling, mentor availability rules, time-off blocks, and Google Meet provisioning.',
    bullets: [
      'Conflict-free calendar slot computation with timezone safety',
      'Automatic Google Meet link generation on booking confirmation',
    ],
    invariant: 'Mentor time-off overrides immediately block public slot booking.',
    stack: ['Calendar API', 'Google Meet', 'OAuth2'],
  },
  {
    id: '11',
    cat: 'security',
    featured: false,
    icon: Shield,
    title: 'Application Security',
    summary:
      'Defense-in-depth headers, role-based access control, and parameterized queries across every route.',
    bullets: [
      'Helmet security policies, CSP, and strict RBAC middleware',
      'Parameterized Prisma queries preventing SQL injection',
    ],
    invariant: 'Admin endpoints require explicit role verification on every call.',
    stack: ['Helmet', 'Rate Limit', 'RBAC'],
  },
  {
    id: '12',
    cat: 'security',
    featured: false,
    icon: FileCheck2,
    title: 'DPDP 2023 & 2025 Compliance',
    summary:
      'Explicit parental/user consent tracking, verifiable audit trails, and privacy-first data retention.',
    bullets: [
      'Granular consent timestamps stored for every user onboarding',
      'Self-service data export and account erasure pipelines',
    ],
    invariant: 'No minor or student data is processed without recorded consent.',
    stack: ['Consent Logs', 'Data Export', 'Erasure'],
  },
  {
    id: '13',
    cat: 'product',
    featured: false,
    icon: Search,
    title: 'Technical SEO & Discovery',
    summary:
      'Semantic structured data, canonical URLs, and OpenGraph cards built for clean organic discoverability.',
    bullets: [
      'Dynamic sitemap.xml, robots.txt, and JSON-LD schema markup',
      'Fast Core Web Vitals with optimized Next.js Image pipelines',
    ],
    invariant: 'Every public route ships with canonical metadata.',
    stack: ['App Metadata', 'JSON-LD', 'Sitemap'],
  },
  {
    id: '14',
    cat: 'data',
    featured: true,
    icon: Database,
    title: 'DR Vault & Smoke Verification',
    summary:
      'Encrypted database snapshots with AES-256-GCM confidentiality, SHA-256 tamper detection, and automated post-build verification suites.',
    bullets: [
      'Zero-plaintext encrypted disaster recovery dumps with integrity digests',
      'Automated API & build smoke tests before every release',
    ],
    invariant: 'Corrupted or tampered snapshots fail verification before restore.',
    stack: ['AES-256-GCM', 'SHA-256', 'Smoke Tests'],
  },
  {
    id: '15',
    cat: 'data',
    featured: false,
    icon: Activity,
    title: 'Observability & Admin Ops',
    summary:
      'Real-time Redis and PostgreSQL telemetry, DR snapshot controls, and full operational visibility.',
    bullets: [
      'Live health endpoints monitoring Elephant & Goldfish latency',
      'Immutable admin audit logs for refunds, bans, and DR actions',
    ],
    invariant: 'Every privileged admin mutation writes an immutable audit row.',
    stack: ['Audit Logs', 'Health API', 'Admin Console'],
  },
];

function AnimatedCounter({ target, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [count, setCount] = useState(target);

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const totalFrames = 24;
    const timer = setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (frame >= totalFrames) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function AnimatedShowcase() {
  const [activeNode, setActiveNode] = useState(FLOW_NODES[0]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedLayerId, setExpandedLayerId] = useState('06');

  const filteredLayers =
    activeCategory === 'all'
      ? TECHNICAL_LAYERS
      : TECHNICAL_LAYERS.filter((layer) => layer.cat === activeCategory);

  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-paper text-ink">
        {/* 1. Editorial Hero — 7:5 Golden Ratio Split */}
        <section className="border-b border-line pt-24 pb-16 md:pt-28 md:pb-20">
          <div className="page-x">
            <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
              {/* Left 7 Columns: Thesis + Ruled Spec Matrix */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-7"
              >
                <div className="inline-flex items-center gap-2.5 border-b border-signal/40 pb-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-signal-deep">
                  <span className="h-2 w-2 rounded-full bg-sprout" />
                  Systems Dossier · Unfoldinn Architecture
                </div>

                <h1 className="mt-6 font-serif text-4xl font-normal leading-[1.06] tracking-[-0.02em] text-ink sm:text-5xl lg:text-[3.75rem]">
                  Every layer of Unfoldinn,{' '}
                  <span className="italic text-signal-deep">engineered from scratch.</span>
                </h1>

                <p className="mt-6 max-w-[58ch] text-base leading-[1.7] text-ink-2 sm:text-lg">
                  From Cloudflare edge filtering and Elephant + Goldfish concurrency to DPDP
                  2023/2025 compliance and AES-256-GCM disaster recovery, nothing here is an
                  off-the-shelf template. Every subsystem was architected and written end-to-end by{' '}
                  <strong className="font-semibold text-ink">Aman Pratap Singh</strong>.
                </p>

                {/* Crisp 4-Cell Ruled Spec Bar */}
                <div className="mt-10 grid grid-cols-2 border border-line bg-paper-2/60 sm:grid-cols-4">
                  <div className="border-b border-r border-line p-4 sm:border-b-0">
                    <div className="font-mono text-2xl font-semibold text-ink">
                      <AnimatedCounter target={15} />
                    </div>
                    <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
                      Core Layers
                    </div>
                  </div>
                  <div className="border-b border-line p-4 sm:border-b-0 sm:border-r">
                    <div className="font-mono text-2xl font-semibold text-signal-deep">
                      <AnimatedCounter target={1000} suffix="+" />
                    </div>
                    <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
                      Parallel Locks
                    </div>
                  </div>
                  <div className="border-r border-line p-4">
                    <div className="font-mono text-lg font-semibold text-ink">AES-256-GCM</div>
                    <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
                      DR Vault
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="font-mono text-lg font-semibold text-sprout-deep">
                      DPDP 2023/25
                    </div>
                    <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
                      Consent Audit
                    </div>
                  </div>
                </div>

                {/* Quick Jump Anchors */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a href="#pipeline" className="btn-editorial">
                    Inspect Live Pipeline
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <a href="#layers" className="btn-editorial-outline">
                    Browse All 15 Layers
                  </a>
                </div>
              </motion.div>

              {/* Right 5 Columns: Crisp Framed Architect Dossier Card */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-5"
              >
                <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-line pb-4">
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                      Principal Architect
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sprout-border bg-sprout-soft px-2.5 py-0.5 font-mono text-[11px] font-medium text-sprout-deep">
                      <span className="h-1.5 w-1.5 rounded-full bg-sprout" />
                      Jaipur · Production
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-12 items-center gap-5">
                    <div className="relative col-span-5 aspect-[4/5] overflow-hidden rounded-xl border border-line bg-paper-2">
                      <Image
                        src="/aman-pratap-singh.jpg"
                        alt="Aman Pratap Singh — Systems Architect"
                        fill
                        sizes="(max-width: 768px) 40vw, 220px"
                        className="object-cover"
                        priority
                      />
                    </div>
                    <div className="col-span-7">
                      <h2 className="font-serif text-2xl font-normal text-ink sm:text-3xl">
                        Aman Pratap Singh
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                        Founder &amp; Full-Stack Systems Architect responsible for infrastructure,
                        security, payments, and product engineering.
                      </p>
                      <div className="mt-4 space-y-1.5 border-t border-line pt-3 font-mono text-[11px] text-muted">
                        <div className="flex justify-between">
                          <span>Primary DB</span>
                          <span className="font-medium text-ink">Postgres 18</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lock Engine</span>
                          <span className="font-medium text-ink">Redis Cloud</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Perimeter</span>
                          <span className="font-medium text-ink">Cloudflare WAF</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 2. Interactive Request Lifecycle & Dark Espresso Telemetry Console (5:7 Ratio) */}
        <section id="pipeline" className="border-b border-line bg-paper-2/70 py-16 md:py-20">
          <div className="page-x">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <span className="eyebrow text-signal-deep">01 · Request Lifecycle</span>
                <h2 className="mt-2 font-serif text-3xl font-normal text-ink sm:text-4xl">
                  Elephant + Goldfish + DR Vault Pipeline
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-ink-2">
                Select any stage below to inspect how requests, atomic Redis locks, PostgreSQL
                transactions, and encrypted DR snapshots execute in sequence.
              </p>
            </div>

            <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-12">
              {/* Left 5 Cols: Interactive Stage List */}
              <div className="flex flex-col gap-2.5 lg:col-span-5">
                {FLOW_NODES.map((node) => {
                  const Icon = node.icon;
                  const isActive = activeNode.id === node.id;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setActiveNode(node)}
                      className={`group relative flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all ${
                        isActive
                          ? 'border-ink bg-ink text-paper shadow-sm'
                          : 'border-line bg-white text-ink hover:border-mocha-light'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-semibold ${
                            isActive
                              ? 'bg-champagne/15 text-champagne'
                              : 'bg-paper-2 text-signal-deep'
                          }`}
                        >
                          {node.step}
                        </span>
                        <div>
                          <div className="text-sm font-semibold">{node.label}</div>
                          <div
                            className={`text-xs ${
                              isActive ? 'text-champagne-light/80' : 'text-muted'
                            }`}
                          >
                            {node.subtitle}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`hidden rounded-full px-2.5 py-0.5 font-mono text-[10px] sm:inline-block ${
                            isActive
                              ? 'bg-paper/10 text-champagne'
                              : 'bg-paper-2 text-ink-2'
                          }`}
                        >
                          {node.metric}
                        </span>
                        <Icon
                          className={`h-4 w-4 ${
                            isActive ? 'text-champagne' : 'text-muted group-hover:text-ink'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right 7 Cols: Espresso Telemetry Console */}
              <div className="flex flex-col justify-between rounded-2xl border border-ink bg-ink p-6 text-paper shadow-md lg:col-span-7 sm:p-8">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-paper/15 pb-4">
                    <div className="flex items-center gap-2 font-mono text-xs text-champagne">
                      <Terminal className="h-4 w-4" />
                      <span>PIPELINE TELEMETRY · STAGE {activeNode.step}</span>
                    </div>
                    <span className="rounded-full border border-champagne/30 bg-champagne/10 px-2.5 py-0.5 font-mono text-[11px] text-champagne">
                      {activeNode.metric}
                    </span>
                  </div>

                  {/* Animated Node Progress Bar */}
                  <div className="mt-6">
                    <div className="grid grid-cols-5 gap-2">
                      {FLOW_NODES.map((n, idx) => {
                        const activeIdx = FLOW_NODES.findIndex((x) => x.id === activeNode.id);
                        const passed = idx <= activeIdx;
                        return (
                          <div key={n.id} className="space-y-1.5">
                            <div className="h-1.5 overflow-hidden rounded-full bg-paper/15">
                              <motion.div
                                initial={false}
                                animate={{ width: passed ? '100%' : '0%' }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                className="h-full rounded-full bg-champagne"
                              />
                            </div>
                            <div className="truncate font-mono text-[10px] text-paper/65">
                              {n.step}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeNode.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                      className="mt-6"
                    >
                      <h3 className="font-serif text-2xl font-normal text-paper sm:text-3xl">
                        {activeNode.label}
                      </h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-paper/85">
                        {activeNode.telemetry}
                      </p>

                      <div className="mt-6 rounded-xl border border-paper/15 bg-black/25 p-4 font-mono text-xs">
                        <div className="mb-2 text-[10px] uppercase tracking-wider text-champagne/80">
                          Execution Trace
                        </div>
                        <div className="space-y-2">
                          {activeNode.trace.map((line, i) => (
                            <div key={line} className="flex items-start gap-2.5 text-paper/90">
                              <span className="text-champagne">{`0${i + 1}`}</span>
                              <span>{line}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-paper/15 pt-4 font-mono text-[11px] text-paper/70">
                  <span>Fail-Closed Architecture</span>
                  <span className="text-champagne">Zero Unverified Writes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Asymmetric Bento Matrix — All 15 Engineering Layers */}
        <section id="layers" className="py-16 md:py-24">
          <div className="page-x">
            <div className="flex flex-col justify-between gap-6 border-b border-line pb-8 md:flex-row md:items-end">
              <div>
                <span className="eyebrow text-signal-deep">02 · Complete Stack Breakdown</span>
                <h2 className="mt-2 font-serif text-3xl font-normal text-ink sm:text-4xl">
                  15 Core Engineering Layers
                </h2>
              </div>

              {/* Filter Tabs with Shared Spring Indicator */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const active = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`relative rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                        active
                          ? 'text-paper'
                          : 'border border-line bg-white text-ink-2 hover:border-ink'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="layerCategoryPill"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                          className="absolute inset-0 rounded-full bg-ink"
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        <span>{cat.label}</span>
                        <span
                          className={`font-mono text-[10px] ${
                            active ? 'text-champagne' : 'text-muted'
                          }`}
                        >
                          {cat.count}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <motion.div layout className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredLayers.map((layer) => {
                  const Icon = layer.icon;
                  const isExpanded = expandedLayerId === layer.id;
                  const spanClass =
                    activeCategory === 'all' && layer.featured ? 'md:col-span-2 lg:col-span-2' : '';

                  return (
                    <motion.article
                      layout
                      key={layer.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className={`group flex flex-col justify-between rounded-2xl border p-6 transition-colors ${spanClass} ${
                        layer.featured
                          ? 'border-mocha/25 bg-paper-2/65 hover:border-ink/40'
                          : 'border-line bg-white hover:border-mocha/35'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-paper font-mono text-xs font-semibold text-signal-deep">
                              {layer.id}
                            </span>
                            {layer.featured && (
                              <span className="rounded-full border border-amber-300 bg-signal-soft px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-signal-deep">
                                Flagship System
                              </span>
                            )}
                          </div>
                          <Icon className="h-4 w-4 text-muted transition-colors group-hover:text-ink" />
                        </div>

                        <h3 className="mt-4 font-serif text-2xl font-normal text-ink">
                          {layer.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-2">{layer.summary}</p>

                        <ul className="mt-4 space-y-2 border-t border-line pt-4">
                          {layer.bullets.map((b) => (
                            <li key={b} className="flex items-start gap-2 text-xs text-ink-2">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-deep" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-5 border-t border-line pt-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            {layer.stack.map((item) => (
                              <span
                                key={item}
                                className="rounded-md border border-line bg-paper px-2 py-0.5 font-mono text-[11px] text-ink-2"
                              >
                                {item}
                              </span>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedLayerId(isExpanded ? null : layer.id)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-signal-deep hover:text-ink"
                          >
                            <span>Guarantee</span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 rounded-lg border border-line bg-paper px-3 py-2 font-mono text-[11px] text-ink">
                                <span className="font-semibold text-signal-deep">Invariant: </span>
                                {layer.invariant}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        {/* 4. Editorial Footer Band */}
        <section className="border-t border-line bg-ink py-14 text-paper">
          <div className="page-x">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.14em] text-champagne">
                  Unfoldinn · Jaipur
                </div>
                <h2 className="mt-2 font-serif text-3xl font-normal text-paper sm:text-4xl">
                  Explore the platform behind the mentoring.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/book"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-champagne px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-paper"
                >
                  Book a Session
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-paper/30 px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-paper/10"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MotionConfig>
  );
}
