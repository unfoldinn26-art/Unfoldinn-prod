'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Infinity as InfinityIcon,
  Layers,
  MessageCircle,
  HelpCircle,
  Heart,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';

const PATH_INNER_LOOP =
  'M11.0479 3.75827C8.9601 4.20831 7.17666 5.0442 5.61556 6.30426C3.47029 8.03593 2.12171 10.4141 1.8006 13.0318L1.73267 13.5855L1.82723 14.6182L1.92178 15.651L2.0939 16.1875C2.95765 18.8797 4.98822 21.0247 8.17029 22.6064C12.0523 24.536 16.5026 24.7989 21.2212 23.3773C24.7755 22.3065 27.7204 20.6526 30.2322 18.3167C30.8813 17.7131 32.3376 15.9924 32.8024 15.28C33.5325 14.1608 34.283 12.6415 34.7513 11.3345C35.0089 10.6154 35.2712 9.71796 35.3128 9.41331L35.335 9.25104L34.6191 10.0964C33.047 11.9532 31.667 13.2997 29.8756 14.7247C27.033 16.986 24.2524 18.4968 21.3002 19.384C20.0804 19.7506 19.584 19.8401 17.9425 19.9891L16.433 20.1261L15.7333 20.0676C14.2219 19.9412 12.9838 19.6706 11.8086 19.2095C9.88227 18.4539 8.21683 17.1164 7.30983 15.5967C6.91605 14.937 6.74255 14.4333 6.63554 13.6397L6.5466 12.9803L6.59687 12.5217C6.90333 9.72516 9.21033 7.14297 12.2843 6.15575C12.6124 6.05038 13.1631 5.89811 13.5081 5.81729L14.1354 5.67043L15.0915 5.61298C16.1544 5.54907 16.7992 5.57546 17.7875 5.72327C19.4462 5.97136 21.1597 6.57378 22.5881 7.41107C22.8443 7.56128 23.0522 7.66587 23.0502 7.64346C23.0422 7.55688 22.0389 6.56398 21.6614 6.26897C20.6168 5.45266 19.5121 4.82878 18.2889 4.36418C17.0662 3.8998 15.9933 3.6594 14.6333 3.54505L14.0412 3.49531L12.6362 3.60702C11.8634 3.66847 11.1487 3.73651 11.0479 3.75827Z';

const PATH_SWEEP_LOOP =
  'M41.6993 3.36097C38.3868 3.32219 34.9644 4.2704 31.4087 6.21207C29.7508 7.11739 28.5246 7.90046 25.3914 10.0549C21.9799 12.4007 20.4052 13.3615 18.3884 14.3283C17.8473 14.5877 17.3898 14.8101 17.3717 14.8225C17.2212 14.9264 18.9663 14.4283 19.6532 14.1714C21.5065 13.4782 22.6869 12.8705 26.8349 10.4746C29.7018 8.81873 31.3866 7.99515 33.1606 7.38234C36.2263 6.32342 38.6974 6.17325 41.2814 6.88892C45.3422 8.0136 48.3276 11.3594 48.709 15.2134C48.7805 15.9356 48.6543 17.3716 48.458 18.0702C47.7878 20.455 46.3489 22.4771 44.1827 24.0784C41.8188 25.8257 38.7351 26.827 35.2525 26.978C33.4519 27.0562 31.7657 26.8836 28.1781 26.2543C25.4155 25.7696 24.6123 25.6544 23.0208 25.5145C21.439 25.3754 20.6161 25.3598 19.1032 25.4399C15.3661 25.6379 11.6847 26.6396 8.66941 28.279C7.7012 28.8055 5.91035 30.1037 5.1211 30.8513C2.82393 33.0272 0.953373 36.1298 0.179725 39.0472C-0.0765022 40.0135 -0.0591132 40.0805 0.269339 39.393C3.22588 33.2048 10.4536 28.8235 18.8045 28.1573C20.9464 27.9864 22.9276 28.1241 25.0698 28.5927C25.8788 28.7696 26.2243 28.8628 28.3603 29.48C31.6324 30.4254 33.6086 30.8383 35.7646 31.0271C41.7924 31.5551 47.8021 29.653 51.7909 25.9551C53.8261 24.0682 55.3289 21.5428 55.9475 18.9699C56.1302 18.2104 56.2604 16.525 56.1959 15.7565C55.8344 11.45 53.169 7.5355 49.0547 5.26866C47.7763 4.56435 46.2822 4.01038 44.8871 3.72359C44.0022 3.54164 42.4958 3.37033 41.6993 3.36097Z';

const LOGO_CONCEPTS = [
  {
    id: 'thought',
    title: 'Continuous Thought',
    desc: 'A flow of ideas that evolves, revisits and never really stops.',
    icon: InfinityIcon,
    focus: 'both',
  },
  {
    id: 'interconnectedness',
    title: 'Interconnectedness',
    desc: 'Different perspectives, experiences and people coming together.',
    icon: Layers,
    focus: 'both',
  },
  {
    id: 'conversation',
    title: 'Conversation',
    desc: 'A space to express, share and be heard.',
    icon: MessageCircle,
    focus: 'inner',
  },
  {
    id: 'curiosity',
    title: 'Curiosity',
    desc: 'The courage to ask, explore and look beyond the obvious.',
    icon: HelpCircle,
    focus: 'dot',
  },
  {
    id: 'care',
    title: 'Care & Nurturing',
    desc: 'A supportive, non-judgmental environment.',
    icon: Heart,
    focus: 'inner',
  },
  {
    id: 'progress',
    title: 'Progress & Possibility',
    desc: 'From one thought or question, new directions and opportunities unfold.',
    icon: TrendingUp,
    focus: 'sweep',
  },
];

export default function AnimatedLogoConcept() {
  const [activeConcept, setActiveConcept] = useState(null);
  const [replayKey, setReplayKey] = useState(0);

  const activeObj = LOGO_CONCEPTS.find((c) => c.id === activeConcept);

  return (
    <section className="mx-auto max-w-[1240px] px-6 py-16 sm:px-10">
      <div className="rounded-[28px] border border-[#e5dfef] bg-[#faf8ff] p-8 sm:p-12">
        {/* Top Centered Stacked Animated SVG Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex flex-col items-start">
            <motion.svg
              key={replayKey}
              width="160"
              height="124"
              viewBox="0 0 57.2704 44.5394"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="overflow-visible"
              aria-label="Animated Unfoldinn symbol"
            >
              {/* 1. Upward Sweeping Ribbon (Progress, Possibility, Flow) */}
              <motion.path
                d={PATH_SWEEP_LOOP}
                fill="#807A9E"
                fillRule="evenodd"
                clipRule="evenodd"
                stroke="#807A9E"
                strokeWidth="0.6"
                initial={{ pathLength: 0, fillOpacity: 0, opacity: 0.3 }}
                whileInView={{
                  pathLength: 1,
                  fillOpacity:
                    !activeObj || activeObj.focus === 'both' || activeObj.focus === 'sweep'
                      ? 1
                      : 0.3,
                  opacity: 1,
                }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  pathLength: { duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] },
                  fillOpacity: { duration: 0.5, delay: 0.7 },
                }}
              />

              {/* 2. Inner Interlocking Loop (Conversation, Care, Thought) */}
              <motion.path
                d={PATH_INNER_LOOP}
                fill="#3B3553"
                fillRule="evenodd"
                clipRule="evenodd"
                stroke="#3B3553"
                strokeWidth="0.6"
                initial={{ pathLength: 0, fillOpacity: 0, opacity: 0.3 }}
                whileInView={{
                  pathLength: 1,
                  fillOpacity:
                    !activeObj || activeObj.focus === 'both' || activeObj.focus === 'inner'
                      ? 1
                      : 0.3,
                  opacity: 1,
                }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  pathLength: { duration: 1.0, delay: 0.55, ease: [0.22, 1, 0.36, 1] },
                  fillOpacity: { duration: 0.5, delay: 1.0 },
                }}
              />
            </motion.svg>

            {/* 3. Spark / Question Dot + Wordmark (Stacked Lockup) */}
            <div className="-mt-2 flex items-center gap-2.5">
              <motion.span
                key={`dot-${replayKey}`}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: [0, 1.35, 1], opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.05 }}
                animate={
                  activeObj?.focus === 'dot'
                    ? { scale: [1, 1.35, 1], transition: { repeat: Infinity, duration: 1.2 } }
                    : {}
                }
                className="h-3.5 w-3.5 rounded-full bg-[#f6b47d]"
              />
              <motion.span
                key={`word-${replayKey}`}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.9 }}
                className="font-shantell text-[1.75rem] font-medium leading-none tracking-[-0.02em]"
              >
                <span className="text-[#e39a5d]">Un</span>
                <span className="text-[#29253a]">foldinn</span>
              </motion.span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setReplayKey((k) => k + 1)}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#e5dfef] bg-white px-3.5 py-1.5 font-wix-text text-[11px] font-semibold text-[#686579] transition-colors hover:border-[#29253a]/30 hover:text-[#29253a]"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Replay logo story</span>
          </button>
        </div>

        {/* "A Closer Look" 6-Concept Interactive Strip */}
        <div className="mt-10 rounded-2xl border border-[#e5dfef] bg-white/85 p-6 shadow-sm">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            <div className="border-b border-[#e5dfef] pb-4 lg:col-span-2 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
              <div className="font-wix-display text-[22px] font-semibold leading-[1.15] text-[#29253a]">
                A Closer Look
              </div>
              <p className="mt-1.5 font-wix-text text-[11px] text-[#686579]">
                Hover any concept to highlight it in the mark
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-10 lg:grid-cols-6">
              {LOGO_CONCEPTS.map((c) => {
                const Icon = c.icon;
                const isActive = activeConcept === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onMouseEnter={() => setActiveConcept(c.id)}
                    onMouseLeave={() => setActiveConcept(null)}
                    onClick={() => setActiveConcept(isActive ? null : c.id)}
                    className={`flex flex-col items-center rounded-xl p-3 text-center transition-all ${
                      isActive
                        ? 'bg-[#f5f0ff] ring-1 ring-[#765c9c]/40'
                        : 'hover:bg-[#faf8ff]'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        isActive ? 'text-[#e39a5d]' : 'text-[#29253a]'
                      }`}
                      strokeWidth={1.6}
                    />
                    <div className="mt-2.5 font-wix-text text-[12px] font-bold text-[#29253a]">
                      {c.title}
                    </div>
                    <p className="mt-1 font-wix-text text-[11px] leading-[1.4] text-[#686579]">
                      {c.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
