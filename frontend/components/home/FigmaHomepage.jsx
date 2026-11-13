'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Users, Sparkles, Compass } from 'lucide-react';
import LogoIntroOverlay from './LogoIntroOverlay';

const CLARITY_PROMPTS = [
  {
    title: 'Setbacks & changing direction',
    subtitle: 'The plan changed. What now?',
    topic: 'setbacks',
  },
  {
    title: 'Exposure & opportunities',
    subtitle: "I don't know what is possible yet.",
    topic: 'exposure',
  },
  {
    title: 'Family expectations',
    subtitle: "We care, but we don't always agree.",
    topic: 'family',
  },
  {
    title: 'Confidence & self-understanding',
    subtitle: 'I doubt myself more than I would like.',
    topic: 'confidence',
  },
  {
    title: 'Something hard to explain',
    subtitle: 'I know something feels stuck.',
    topic: 'stuck',
  },
  {
    title: 'College to work',
    subtitle: 'What comes after education?',
    topic: 'transition',
  },
];

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Talk',
    desc: "Begin with what's on your mind.",
  },
  {
    step: '02',
    title: 'Understand',
    desc: 'Explore the concerns and influences behind it.',
  },
  {
    step: '03',
    title: 'Explore',
    desc: 'Consider different perspectives and possibilities.',
  },
  {
    step: '04',
    title: 'Choose',
    desc: 'Identify a realistic next step you are willing to own.',
  },
  {
    step: '05',
    title: 'Follow through',
    desc: 'Review progress when follow-up is part of the arrangement.',
  },
];

const OUTCOMES = [
  {
    num: '01',
    title: 'Clarity',
    desc: 'See what matters beneath the noise.',
    icon: Sparkles,
  },
  {
    num: '02',
    title: 'Confidence',
    desc: 'Trust your ability to move forward.',
    icon: Users,
  },
  {
    num: '03',
    title: 'Exposure',
    desc: 'Notice pathways you had not considered.',
    icon: Compass,
  },
  {
    num: '04',
    title: 'Action',
    desc: 'Turn reflection into a realistic next step.',
    icon: ChevronRight,
  },
  {
    num: '05',
    title: 'Ownership',
    desc: 'Make thoughtful choices that feel like yours.',
    icon: Sparkles,
  },
];

const STUDENT_CARDS = [
  {
    name: 'Jia Soni',
    meta: 'BBA 2022-2025 Batch',
    img: '/images/students/jia-soni.png',
    quote:
      'You built our character and prepared us for reality--not just exams.',
  },
  {
    name: 'Jaya Sodhani',
    meta: 'B.Des 2021-2025 Batch',
    img: '/images/students/jaya-sodhani.png',
    quote:
      'Conversations that helped me trust my own perspective when everything felt loud.',
  },
  {
    name: 'Aaditya Kakkar',
    meta: 'UX Designer at GoDaddy Inc',
    img: '/images/students/aaditya-kakkar.png',
    quote:
      'Learned how to think independently about craft, career, and life decisions.',
  },
  {
    name: 'Bismanpreet Singh',
    meta: 'B.Tech Batch 2019-2023',
    img: '/images/students/bismanpreet-singh.png',
    quote:
      'You saw potential in me before I did and gave me the confidence to lead.',
  },
  {
    name: 'Rashi Gothwal',
    meta: 'BBA 2020-2023 Batch',
    img: '/images/students/rashi-gothwal.png',
    quote:
      'A calm space to ask real questions without being handed generic templates.',
  },
  {
    name: 'Vaibhav Khandelwal',
    meta: 'Founder at SONICORE',
    img: '/images/students/vaibhav-khandelwal.png',
    quote:
      'Guidance that respects your curiosity and helps you own the next step.',
  },
];

const FAQS = [
  {
    q: 'How do I know if Unfoldinn mentoring is right for me?',
    a: 'If you are between 16 and 25 and navigating choices around studies, career direction, transitions, or self-doubt--and want a calm, honest conversation rather than generic advice--Unfoldinn is built for you.',
  },
  {
    q: 'What can I expect during my first mentoring session?',
    a: 'You do not need a prepared agenda. We begin with what is on your mind, unpack the context and expectations around it, and explore perspectives so you leave with clarity on your next step.',
  },
  {
    q: 'Are my mentoring sessions completely confidential?',
    a: 'Yes. Conversations are private and protected by clear professional boundaries, with explicit consent standards under DPDP 2023/2025.',
  },
  {
    q: 'How long does it take to see clarity from a conversation?',
    a: 'Many young people leave their very first 1:1 conversation with a clearer framing of their options and one realistic action to test over the next 7 days.',
  },
  {
    q: 'Do you offer online or virtual mentoring sessions?',
    a: 'Yes. While Unfoldinn is rooted in Jaipur, 1:1 sessions are available online via Google Meet for students and families across India and globally.',
  },
];

export default function FigmaHomepage() {
  const [selectedClarity, setSelectedClarity] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <MotionConfig reducedMotion="never">
      <LogoIntroOverlay />
      <div className="w-full overflow-x-clip bg-white text-[#29253a]">
        {/* 1. HERO SECTION */}
        <section className="px-3 pt-24 pb-10 sm:px-6 md:px-10 md:pt-28">
          <div
            className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[28px] px-6 py-12 sm:px-10 md:px-14 md:py-16"
            style={{
              backgroundImage:
                'linear-gradient(153deg, rgb(238, 230, 255) 0%, rgb(245, 233, 242) 62%, rgb(248, 209, 173) 100%)',
            }}
          >
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
              {/* Left Copy */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="lg:col-span-6"
              >
                <div className="inline-flex items-center gap-2 font-wix-text text-[12px] font-semibold uppercase tracking-[0.12em] text-[#686579]">
                  <span className="h-2 w-2 rounded-full bg-[#e39a5d]" />
                  <span>Personal mentoring &middot; Ages 16&ndash;25 &middot; Jaipur</span>
                </div>

                <h1 className="mt-5 font-wix-display text-[2.5rem] font-medium leading-[1.05] tracking-[-0.03em] text-[#29253a] sm:text-[3.5rem] lg:text-[4rem]">
                  You don&rsquo;t have to figure it all out{' '}
                  <span className="relative inline-block italic">
                    alone.
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-1 left-0 h-3 w-full -rotate-1 rounded-full bg-[#f6b47d]/65"
                    />
                  </span>
                </h1>

                <p className="mt-6 max-w-[46ch] font-wix-text text-[16px] leading-[1.65] text-[#4c465d] sm:text-[17px]">
                  Sometimes, the right conversation can help you understand what&rsquo;s on your mind,
                  explore possibilities and find your next step.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/book"
                    className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-[100px] bg-[#29253a] px-7 font-wix-text text-[14px] font-semibold text-white transition-all hover:bg-[#3a3451] active:scale-[0.98]"
                  >
                    <span>Start a conversation</span>
                    <img
                      src="/icons/arrow-right-circle-white.svg"
                      alt=""
                      width={20}
                      height={20}
                      aria-hidden="true"
                      className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>

                  <a
                    href="#approach"
                    className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-[100px] border border-[#e5dfef] bg-white/85 px-7 font-wix-text text-[14px] font-semibold text-[#29253a] transition-all hover:bg-white"
                  >
                    <span>Explore Unfoldinn</span>
                    <img
                      src="/icons/arrow-right-circle-dark.svg"
                      alt=""
                      width={20}
                      height={20}
                      aria-hidden="true"
                      className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                    />
                  </a>
                </div>

                <div className="mt-8 flex items-center gap-3 text-[13px] text-[#5e5870]">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ffe79a] text-[#29253a]">
                    &#10022;
                  </span>
                  <span className="font-wix-text">
                    You can begin with a question&mdash;even if you don&rsquo;t have all the words yet.
                  </span>
                </div>
              </motion.div>

              {/* Right 4-Panel Geometric Photo Collage */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.65, delay: 0.1 }}
                className="relative mx-auto w-full max-w-[490px] lg:col-span-6"
              >
                {/* Decorative corner ribbons */}
                <div
                  aria-hidden="true"
                  className="absolute -top-3 -left-3 h-36 w-36 rounded-tl-[28px] bg-[#765c9c]/25"
                />
                <div
                  aria-hidden="true"
                  className="absolute -right-3 -bottom-3 h-40 w-40 rounded-br-[28px] bg-[#29253a]"
                />

                <div className="relative grid grid-cols-12 gap-3.5">
                  <div className="col-span-7 aspect-square overflow-hidden rounded-[20px] bg-white shadow-md">
                    <img
                      src="/images/hero/hero-collage-1.png"
                      alt="Mentoring conversation with students"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="col-span-5 aspect-[3/4] overflow-hidden rounded-[20px] bg-white shadow-md">
                    <img
                      src="/images/hero/hero-collage-2.png"
                      alt="Reflective student session"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="col-span-5 aspect-square overflow-hidden rounded-[20px] bg-white shadow-md">
                    <img
                      src="/images/hero/hero-collage-3.png"
                      alt="Students collaborating together"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="col-span-7 aspect-[16/10] overflow-hidden rounded-[20px] bg-white shadow-md">
                    <img
                      src="/images/hero/hero-collage-4.png"
                      alt="One-on-one conversation"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <img
                  src="/icons/sparkle-star.svg"
                  alt=""
                  width={40}
                  height={40}
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-5 -left-5 h-10 w-10"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* 2. THREE PILLARS + BENTO APPROACH ROW */}
        <section id="approach" className="mx-auto max-w-[1240px] px-6 py-12 sm:px-10">
          <div className="grid grid-cols-1 gap-8 border-b border-[#e5dfef] pb-10 md:grid-cols-3">
            {[
              {
                title: 'Personal Guidance',
                desc: 'A space to talk through your questions, understand your situation, and explore what matters to you.',
              },
              {
                title: 'Wider Perspectives',
                desc: 'Look beyond familiar choices, discover new possibilities, and consider different ways forward.',
              },
              {
                title: 'Meaningful Action',
                desc: 'Turn reflection into considered decisions and practical next steps that feel right for you.',
              },
            ].map((pillar) => (
              <div key={pillar.title} className="space-y-2">
                <h2 className="font-wix-display text-[18px] font-semibold text-[#29253a]">
                  {pillar.title}
                </h2>
                <p className="font-wix-text text-[14px] leading-[1.6] text-[#686579]">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>

          {/* 4-Card Bento Strip */}
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col justify-between rounded-[24px] bg-[#29253a] p-6 text-white">
              <div>
                <p className="font-wix-text text-[10px] font-bold uppercase tracking-[0.14em] text-[#f6b47d]">
                  The Guidance Approach
                </p>
                <h3 className="mt-3 font-wix-display text-[22px] font-medium leading-[1.2] text-white">
                  Discover Your Own Way Forward
                </h3>
                <p className="mt-3 font-wix-text text-[13px] leading-[1.6] text-[#c9c3d5]">
                  Understand yourself. Explore possibilities. Make thoughtful choices.
                </p>
              </div>
              <Link
                href="/how-it-works"
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-wix-text text-[12px] font-semibold text-white transition hover:bg-white/20"
              >
                <span>Explore Approach</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-hidden rounded-[24px] bg-[#f5f0ff]">
              <img
                src="/images/approach/approach-1.png"
                alt="Group discussion session"
                className="h-full min-h-[220px] w-full object-cover"
              />
            </div>

            <div className="overflow-hidden rounded-[24px] bg-[#fcf8ee]">
              <img
                src="/images/approach/approach-2.png"
                alt="Mentoring dialogue"
                className="h-full min-h-[220px] w-full object-cover"
              />
            </div>

            <div className="flex flex-col justify-between rounded-[24px] border border-[#e5dfef] bg-[#faf8ff] p-6">
              <div>
                <span className="font-wix-text text-[11px] font-semibold text-[#765c9c]">
                  One-to-one
                </span>
                <h3 className="mt-2 font-wix-display text-[26px] font-medium text-[#29253a]">
                  Personal
                </h3>
                <p className="mt-2 font-wix-text text-[13px] leading-[1.6] text-[#686579]">
                  Guidance shaped around your questions and circumstances.
                </p>
              </div>
              <div className="mt-4 h-24 overflow-hidden rounded-xl">
                <img
                  src="/images/approach/approach-3.png"
                  alt="Personal 1:1 session"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3. WHEN THE WAY FORWARD FEELS UNCERTAIN */}
        <section className="mx-auto max-w-[1240px] px-6 py-16 sm:px-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <h2 className="max-w-[900px] font-wix-display text-[2.25rem] font-medium leading-[1.08] tracking-[-0.03em] text-[#29253a] sm:text-[3.5rem]">
              When the way forward feels{' '}
              <span className="relative inline-block">
                uncertain.
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 h-3 w-full -rotate-1 rounded-full bg-[#f6b47d]/65"
                />
              </span>
            </h2>
            <div aria-hidden="true" className="relative hidden h-14 w-16 sm:block">
              <div className="absolute top-0 right-0 h-8 w-8 rounded-[3px] bg-[#ffe79a]" />
              <div className="absolute bottom-0 left-0 h-8 w-8 rounded-[3px] bg-[#f3e8f6]" />
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-[#f5f5f5] shadow-sm lg:col-span-5">
              <img
                src="/images/uncertain/uncertain-left.png"
                alt="Looking out over the city"
                className="h-[320px] w-full object-cover grayscale"
              />
            </div>

            <div className="flex flex-col items-center text-center lg:col-span-4 lg:items-start lg:text-left">
              <p className="font-wix-text text-[14px] leading-[1.65] text-[#5a635b]">
                Life doesn&apos;t always follow a straight path. Changing plans, unfamiliar choices,
                and expectations can leave you wondering what comes next. Sometimes, exploring a
                different perspective can help you see possibilities you hadn&apos;t considered.
              </p>
              <Link
                href="/book"
                aria-label="Start a conversation"
                className="mt-8 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#29253a] text-white shadow-sm transition-transform hover:scale-105"
              >
                <img
                  src="/icons/arrow-up-right-white.svg"
                  alt=""
                  width={20}
                  height={20}
                  aria-hidden="true"
                />
              </Link>
            </div>

            <div className="overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-[#f5f5f5] shadow-sm lg:col-span-3">
              <img
                src="/images/uncertain/uncertain-right.png"
                alt="Reviewing options together"
                className="h-[200px] w-full object-cover grayscale"
              />
            </div>
          </div>
        </section>

        {/* 4. WHAT WOULD YOU LIKE CLARITY ON? */}
        <section className="mx-auto max-w-[1240px] px-6 py-16 sm:px-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="font-wix-text text-[11px] font-bold uppercase tracking-[0.12em] text-[#765c9c]">
                Start where you are
              </p>
              <h2 className="mt-3 font-wix-display text-[2.25rem] font-medium leading-[1.08] tracking-[-0.03em] text-[#29253a] sm:text-[3.5rem]">
                What would you like{' '}
                <span className="relative inline-block text-[#e39a5d]">
                  clarity
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-2.5 w-full -rotate-1 rounded-full bg-[#f6b47d]/40"
                  />
                </span>{' '}
                on?
              </h2>
            </div>
            <p className="max-w-[300px] font-wix-text text-[14px] leading-[1.6] text-[#686579]">
              There is no right way to begin. Choose what feels closest to what is on your mind.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:col-span-7">
              {CLARITY_PROMPTS.map((item, idx) => {
                const active = selectedClarity === idx;
                return (
                  <Link
                    key={item.title}
                    href={`/book?topic=${item.topic}`}
                    onMouseEnter={() => setSelectedClarity(idx)}
                    className={`group flex items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                      active
                        ? 'border-[#29253a] bg-[#f5f0ff]/60 shadow-sm'
                        : 'border-[#e5dfef] bg-white hover:border-[#765c9c]'
                    }`}
                  >
                    <div>
                      <div className="font-wix-text text-[14px] font-semibold text-[#29253a]">
                        {item.title}
                      </div>
                      <div className="mt-0.5 font-wix-text text-[12px] text-[#686579]">
                        {item.subtitle}
                      </div>
                    </div>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e5dfef] text-[#29253a] transition-colors group-hover:bg-[#29253a] group-hover:text-white">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3.5 lg:col-span-5">
              <div className="space-y-3.5">
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="/images/clarity/clarity-1.png"
                    alt="Group mentoring"
                    className="h-36 w-full object-cover"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="/images/clarity/clarity-2.png"
                    alt="Exploring new paths"
                    className="h-44 w-full object-cover"
                  />
                </div>
                <div className="rounded-xl bg-[#29253a] px-4 py-3 text-white">
                  <div className="font-wix-display text-[15px] font-medium">Beyond the Obvious</div>
                  <div className="font-wix-text text-[11px] text-[#c9c3d5]">
                    Room to Discover
                  </div>
                </div>
              </div>
              <div className="space-y-3.5 pt-6">
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="/images/clarity/clarity-3.png"
                    alt="Student reflection"
                    className="h-36 w-full object-cover"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="/images/clarity/clarity-4.png"
                    alt="University campus transition"
                    className="h-44 w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. SOMETIMES A DIFFERENT PERSPECTIVE CHANGES EVERYTHING */}
        <section className="bg-[#f5f0ff] py-20">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="font-wix-text text-[11px] font-bold uppercase tracking-[1.32px] text-[#765c9c]">
                Why conversation matters
              </p>
              <h2 className="mt-4 font-wix-display text-[2.25rem] font-medium leading-[1.06] tracking-[-0.03em] text-[#29253a] sm:text-[3.5rem]">
                Sometimes, a different perspective changes everything.
              </h2>
              <p className="mt-6 max-w-[40ch] font-wix-text text-[16px] leading-[1.7] text-[#686579]">
                Advice, comparison and endless options can make an important decision feel even
                louder. A thoughtful conversation creates space to pause, notice what is really
                going on and move with intention.
              </p>
            </div>

            <div className="relative flex min-h-[380px] items-center justify-center lg:col-span-6">
              {/* Orbiting Question Pills */}
              <motion.span
                initial={false}
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                className="absolute top-4 left-2 -rotate-6 rounded-full border border-[#e5dfef] bg-white px-4 py-2.5 font-wix-text text-[11px] text-[#686579] shadow-sm sm:left-8"
              >
                &ldquo;Choose something safe.&rdquo;
              </motion.span>
              <motion.span
                initial={false}
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 5.2, ease: 'easeInOut', delay: 0.5 }}
                className="absolute top-6 right-2 rounded-full border border-[#e5dfef] bg-white px-4 py-2.5 font-wix-text text-[11px] text-[#686579] shadow-sm sm:right-8"
              >
                Too many options
              </motion.span>
              <motion.span
                initial={false}
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4.8, ease: 'easeInOut', delay: 1.0 }}
                className="absolute bottom-6 left-4 rounded-full border border-[#e5dfef] bg-white px-4 py-2.5 font-wix-text text-[11px] text-[#686579] shadow-sm sm:left-10"
              >
                What if I get it wrong?
              </motion.span>
              <motion.span
                initial={false}
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 5.5, ease: 'easeInOut', delay: 1.4 }}
                className="absolute right-2 bottom-4 rotate-3 rounded-full border border-[#e5dfef] bg-white px-4 py-2.5 font-wix-text text-[11px] text-[#686579] shadow-sm sm:right-6"
              >
                What is everyone else doing?
              </motion.span>

              {/* Central Pause Circle */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.04 }}
                className="flex h-[270px] w-[270px] flex-col items-center justify-center rounded-full bg-[#ffe79a] p-7 text-center shadow-[0_0_0_24px_rgba(255,255,255,0.4)]"
              >
                <span className="font-wix-text text-[12px] font-bold uppercase tracking-[2.3px] text-[#29253a]">
                  PAUSE
                </span>
                <p className="mt-3 font-wix-display text-[23px] font-medium leading-[1.35] text-[#29253a]">
                  Your perspective belongs in the picture.
                </p>
                <span className="mt-4 font-wix-text text-[10px] text-[#29253a]/80">
                  understand &rarr; explore &rarr; choose
                </span>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 6. MEET DEEPAK SOGANI */}
        <section className="mx-auto max-w-[1240px] px-6 py-20 sm:px-10">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="relative mx-auto w-full max-w-[390px] lg:col-span-5">
              <div className="overflow-hidden rounded-t-[200px] rounded-b-[26px] bg-[#eee6ff]">
                <img
                  src="/images/founder/deepak-sogani.png"
                  alt="Deepak Sogani smiling"
                  className="h-[480px] w-full object-cover"
                />
              </div>
              <div className="absolute -right-2 bottom-6 -rotate-6 flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#ffe79a] p-3 text-center shadow-md">
                <span className="font-wix-text text-[10px] leading-[1.4] text-[#29253a]">
                  Founder &amp; mentor
                  <br />
                  Jaipur, India
                </span>
              </div>
            </div>

            <div className="lg:col-span-7">
              <p className="font-wix-text text-[11px] font-bold uppercase tracking-[1.32px] text-[#765c9c]">
                Meet Deepak Sogani
              </p>
              <h2 className="mt-3 font-wix-display text-[2.5rem] font-medium leading-[1.06] tracking-[-0.03em] text-[#29253a] sm:text-[3.5rem]">
                <span className="relative inline-block">
                  Experience,
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-3 w-full -rotate-1 rounded-full bg-[#f6b47d]/65"
                  />
                </span>{' '}
                offered with curiosity.
              </h2>

              <p className="mt-6 max-w-[56ch] font-wix-text text-[17px] leading-[1.7] text-[#686579]">
                After decades across corporate leadership, entrepreneurship and higher education,
                Deepak chose to dedicate his next chapter to helping young people think through the
                questions that shape their lives.
              </p>

              <blockquote className="mt-6 border-l-[3px] border-[#f6b47d] pl-5 font-wix-display text-[22px] font-medium leading-[1.45] text-[#29253a]">
                &ldquo;My role is not to hand over answers. It is to listen, ask useful questions and
                help a young person see more clearly for themselves.&rdquo;
              </blockquote>

              <div className="mt-7 flex items-center gap-4">
                <span className="font-wix-display text-[42px] font-semibold leading-none text-[#29253a]">
                  35+
                </span>
                <span className="max-w-[220px] font-wix-text text-[12px] leading-[1.45] text-[#686579]">
                  years of lived, professional and educational experience
                </span>
              </div>

              <Link
                href="/about"
                className="group mt-8 inline-flex h-12 items-center justify-center gap-2.5 rounded-[100px] bg-[#29253a] px-7 font-wix-text text-[14px] font-semibold text-white transition-all hover:bg-[#3a3451]"
              >
                <span>Read Founder&rsquo;s story</span>
                <img
                  src="/icons/arrow-right-circle-founder.svg"
                  alt=""
                  width={20}
                  height={20}
                  aria-hidden="true"
                  className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </section>

        {/* 7. HOW A CONVERSATION MOVES FORWARD */}
        <section className="bg-[#29253a] py-20 text-white">
          <div className="mx-auto max-w-[1240px] px-6 sm:px-10">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="font-wix-text text-[11px] font-bold uppercase tracking-[1.32px] text-[#f6b47d]">
                  A human process, not a formula
                </p>
                <h2 className="mt-3 font-wix-display text-[2.25rem] font-medium leading-[1.08] tracking-[-0.03em] text-white sm:text-[3.25rem]">
                  How a conversation moves forward.
                </h2>
              </div>
              <p className="max-w-[340px] font-wix-text text-[14px] leading-[1.6] text-[#c9c3d5]">
                Structured enough to create momentum. Flexible enough to meet the young person where
                they are.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 border-t border-white/15 pt-10 sm:grid-cols-2 lg:grid-cols-5">
              {PROCESS_STEPS.map((s, idx) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  className="space-y-3"
                >
                  <span className="font-mono text-[12px] text-[#f6b47d]">{s.step}</span>
                  <h3 className="font-wix-display text-[22px] font-medium text-white">
                    {s.title}
                  </h3>
                  <p className="font-wix-text text-[13px] leading-[1.6] text-[#c9c3d5]">
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. WHAT CAN CHANGE THROUGH MENTORING? */}
        <section className="mx-auto max-w-[1240px] px-6 py-20 sm:px-10">
          <h2 className="max-w-[680px] font-wix-display text-[2.25rem] font-medium leading-[1.08] tracking-[-0.03em] text-[#29253a] sm:text-[3.25rem]">
            What can change through{' '}
            <span className="relative inline-block">
              mentoring?
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-3 w-full -rotate-1 rounded-full bg-[#f6b47d]/65"
              />
            </span>
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {OUTCOMES.map((o) => {
              const Icon = o.icon;
              return (
                <div
                  key={o.num}
                  className="flex flex-col justify-between rounded-2xl border border-[#e5dfef] bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold text-[#765c9c]">
                      {o.num}
                    </span>
                    <Icon className="h-4 w-4 text-[#e39a5d]" />
                  </div>
                  <div className="mt-6">
                    <h3 className="font-wix-display text-[20px] font-medium text-[#29253a]">
                      {o.title}
                    </h3>
                    <p className="mt-1.5 font-wix-text text-[13px] leading-[1.55] text-[#686579]">
                      {o.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 9. FOR PARENTS & FOR INSTITUTIONS SPLIT CARDS */}
        <section className="mx-auto max-w-[1240px] px-6 py-8 sm:px-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* For Parents */}
            <div className="flex flex-col justify-between rounded-[28px] bg-[#eee6ff] p-8 sm:p-12">
              <div>
                <p className="font-wix-text text-[13px] font-extrabold uppercase tracking-[1.32px] text-[#524588]">
                  For parents
                </p>
                <h3 className="mt-4 font-wix-display text-[28px] font-medium leading-[1.2] tracking-[-0.02em] text-[#29253a] sm:text-[34px]">
                  Support their thinking, not just their decision.
                </h3>
                <p className="mt-4 font-wix-text text-[16px] leading-[1.65] text-[#686579]">
                  Second Innings complements a parent&rsquo;s role by making space for reflection,
                  exploration and growing independence.
                </p>
              </div>
              <Link
                href="/for-parents"
                className="mt-8 inline-flex h-12 w-fit items-center gap-2.5 rounded-[100px] border border-[#e5dfef] bg-white/80 px-6 font-wix-text text-[14px] font-semibold text-[#29253a] transition hover:bg-white"
              >
                <span>Understand the approach</span>
                <img
                  src="/icons/arrow-right-circle-parents.svg"
                  alt=""
                  width={20}
                  height={20}
                  aria-hidden="true"
                />
              </Link>
            </div>

            {/* For Institutions */}
            <div className="flex flex-col justify-between rounded-[28px] bg-[#f6b47d] p-8 sm:p-12">
              <div>
                <p className="font-wix-text text-[13px] font-extrabold uppercase tracking-[1.32px] text-[#524588]">
                  For institutions
                </p>
                <h3 className="mt-4 font-wix-display text-[28px] font-medium leading-[1.2] tracking-[-0.02em] text-[#29253a] sm:text-[34px]">
                  Life readiness belongs alongside academics.
                </h3>
                <p className="mt-4 font-wix-text text-[16px] leading-[1.65] text-[#4c4050]">
                  Explore thoughtful mentoring conversations and programmes for students navigating
                  choices and transitions.
                </p>
              </div>
              <Link
                href="/for-institutions"
                className="mt-8 inline-flex h-12 w-fit items-center gap-2.5 rounded-[100px] bg-[#29253a] px-6 font-wix-text text-[14px] font-semibold text-white transition hover:bg-[#3a3451]"
              >
                <span>Explore a collaboration</span>
                <img
                  src="/icons/arrow-right-circle-institutions.svg"
                  alt=""
                  width={20}
                  height={20}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </section>

        {/* 10. STUDENT VOICES */}
        <section className="mx-auto max-w-[1240px] px-6 py-20 sm:px-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="font-wix-text text-[11px] font-bold uppercase tracking-[1.32px] text-[#765c9c]">
                Possibilities, not promises
              </p>
              <h2 className="mt-3 font-wix-display text-[2.25rem] font-medium leading-[1.08] tracking-[-0.03em] text-[#29253a] sm:text-[3.25rem]">
                Voices from students &amp; alumni.
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  '/images/students/avatar-1.png',
                  '/images/students/avatar-2.png',
                  '/images/students/avatar-3.png',
                  '/images/students/avatar-4.png',
                ].map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <span className="font-wix-text text-[13px] font-semibold text-[#29253a]">
                Trusted by 3k+ Students Globally
              </span>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Featured Group Photo */}
            <div className="relative overflow-hidden rounded-[24px] bg-[#f5f0ff] lg:col-span-5">
              <img
                src="/images/students/group-featured.png"
                alt="Deepak Sogani with students"
                className="h-full min-h-[340px] w-full object-cover"
              />
              <div className="absolute inset-x-4 bottom-4 flex flex-wrap gap-2">
                {['Exposure', 'Confidence', 'Choices', 'Meaningful perspectives'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/95 px-3 py-1 font-wix-text text-[11px] font-semibold text-[#29253a] shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Student Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3">
              {STUDENT_CARDS.map((s, idx) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: idx * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="group relative overflow-hidden rounded-[20px] bg-[#29253a] text-white"
                >
                  <img
                    src={s.img}
                    alt={s.name}
                    className="h-52 w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#29253a] via-[#29253a]/40 to-transparent" />
                  <div className="absolute inset-x-4 bottom-4">
                    <p className="line-clamp-2 font-wix-text text-[11px] leading-[1.45] text-[#e5dfef]">
                      &ldquo;{s.quote}&rdquo;
                    </p>
                    <div className="mt-2 font-wix-display text-[15px] font-medium text-white">
                      {s.name}
                    </div>
                    <div className="font-wix-text text-[10px] text-[#f6b47d]">{s.meta}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 11. FREQUENTLY ASKED QUESTIONS */}
        <section className="relative overflow-hidden bg-[#29253a] py-20 text-white">
          <img
            src="/images/faq/faq-backdrop.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
          />
          <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 gap-12 px-6 sm:px-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="font-wix-display text-[2.25rem] font-medium leading-[1.1] text-white sm:text-[3rem]">
                Frequently asked questions
              </h2>
            </div>

            <div className="divide-y divide-white/15 lg:col-span-7">
              {FAQS.map((item, idx) => {
                const open = openFaq === idx;
                return (
                  <div key={item.q} className="py-5">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? -1 : idx)}
                      className="flex w-full items-center justify-between gap-4 text-left"
                    >
                      <span className="font-wix-display text-[18px] font-medium text-white sm:text-[20px]">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[#f6b47d] transition-transform ${
                          open ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="mt-3 font-wix-text text-[14px] leading-[1.65] text-[#c9c3d5]">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 12. FINAL CTA */}
        <section
          className="px-6 py-20 text-center sm:px-10"
          style={{
            backgroundImage:
              'linear-gradient(165deg, rgb(238, 230, 255) 0%, rgb(248, 213, 194) 100%)',
          }}
        >
          <div className="mx-auto max-w-[780px]">
            <p className="font-wix-text text-[11px] font-bold uppercase tracking-[1.36px] text-[#765c9c]">
              A gentle place to begin
            </p>
            <h2 className="mt-4 font-wix-display text-[2.25rem] font-normal leading-[1.1] tracking-[-0.03em] text-[#29253a] sm:text-[3.25rem]">
              Your first step doesn&rsquo;t have to be a big one.
            </h2>
            <p className="mt-4 font-wix-text text-[18px] text-[#686579]">
              Sometimes, it can simply be a conversation.
            </p>
            <Link
              href="/book"
              className="group mt-8 inline-flex h-12 items-center justify-center gap-2.5 rounded-[100px] bg-[#29253a] px-7 font-wix-text text-[14px] font-semibold text-white transition-all hover:bg-[#3a3451]"
            >
              <span>Start a conversation</span>
              <img
                src="/icons/arrow-right-circle-cta.svg"
                alt=""
                width={20}
                height={20}
                aria-hidden="true"
                className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </section>
      </div>
    </MotionConfig>
  );
}
