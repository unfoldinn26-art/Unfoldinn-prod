'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const PATH_INNER_LOOP =
  'M11.0479 3.75827C8.9601 4.20831 7.17666 5.0442 5.61556 6.30426C3.47029 8.03593 2.12171 10.4141 1.8006 13.0318L1.73267 13.5855L1.82723 14.6182L1.92178 15.651L2.0939 16.1875C2.95765 18.8797 4.98822 21.0247 8.17029 22.6064C12.0523 24.536 16.5026 24.7989 21.2212 23.3773C24.7755 22.3065 27.7204 20.6526 30.2322 18.3167C30.8813 17.7131 32.3376 15.9924 32.8024 15.28C33.5325 14.1608 34.283 12.6415 34.7513 11.3345C35.0089 10.6154 35.2712 9.71796 35.3128 9.41331L35.335 9.25104L34.6191 10.0964C33.047 11.9532 31.667 13.2997 29.8756 14.7247C27.033 16.986 24.2524 18.4968 21.3002 19.384C20.0804 19.7506 19.584 19.8401 17.9425 19.9891L16.433 20.1261L15.7333 20.0676C14.2219 19.9412 12.9838 19.6706 11.8086 19.2095C9.88227 18.4539 8.21683 17.1164 7.30983 15.5967C6.91605 14.937 6.74255 14.4333 6.63554 13.6397L6.5466 12.9803L6.59687 12.5217C6.90333 9.72516 9.21033 7.14297 12.2843 6.15575C12.6124 6.05038 13.1631 5.89811 13.5081 5.81729L14.1354 5.67043L15.0915 5.61298C16.1544 5.54907 16.7992 5.57546 17.7875 5.72327C19.4462 5.97136 21.1597 6.57378 22.5881 7.41107C22.8443 7.56128 23.0522 7.66587 23.0502 7.64346C23.0422 7.55688 22.0389 6.56398 21.6614 6.26897C20.6168 5.45266 19.5121 4.82878 18.2889 4.36418C17.0662 3.8998 15.9933 3.6594 14.6333 3.54505L14.0412 3.49531L12.6362 3.60702C11.8634 3.66847 11.1487 3.73651 11.0479 3.75827Z';

const PATH_SWEEP_LOOP =
  'M41.6993 3.36097C38.3868 3.32219 34.9644 4.2704 31.4087 6.21207C29.7508 7.11739 28.5246 7.90046 25.3914 10.0549C21.9799 12.4007 20.4052 13.3615 18.3884 14.3283C17.8473 14.5877 17.3898 14.8101 17.3717 14.8225C17.2212 14.9264 18.9663 14.4283 19.6532 14.1714C21.5065 13.4782 22.6869 12.8705 26.8349 10.4746C29.7018 8.81873 31.3866 7.99515 33.1606 7.38234C36.2263 6.32342 38.6974 6.17325 41.2814 6.88892C45.3422 8.0136 48.3276 11.3594 48.709 15.2134C48.7805 15.9356 48.6543 17.3716 48.458 18.0702C47.7878 20.455 46.3489 22.4771 44.1827 24.0784C41.8188 25.8257 38.7351 26.827 35.2525 26.978C33.4519 27.0562 31.7657 26.8836 28.1781 26.2543C25.4155 25.7696 24.6123 25.6544 23.0208 25.5145C21.439 25.3754 20.6161 25.3598 19.1032 25.4399C15.3661 25.6379 11.6847 26.6396 8.66941 28.279C7.7012 28.8055 5.91035 30.1037 5.1211 30.8513C2.82393 33.0272 0.953373 36.1298 0.179725 39.0472C-0.0765022 40.0135 -0.0591132 40.0805 0.269339 39.393C3.22588 33.2048 10.4536 28.8235 18.8045 28.1573C20.9464 27.9864 22.9276 28.1241 25.0698 28.5927C25.8788 28.7696 26.2243 28.8628 28.3603 29.48C31.6324 30.4254 33.6086 30.8383 35.7646 31.0271C41.7924 31.5551 47.8021 29.653 51.7909 25.9551C53.8261 24.0682 55.3289 21.5428 55.9475 18.9699C56.1302 18.2104 56.2604 16.525 56.1959 15.7565C55.8344 11.45 53.169 7.5355 49.0547 5.26866C47.7763 4.56435 46.2822 4.01038 44.8871 3.72359C44.0022 3.54164 42.4958 3.37033 41.6993 3.36097Z';

const MEANING_BEATS = [
  { label: 'Curiosity', sub: 'It begins with the courage to ask.' },
  { label: 'Continuous Thought', sub: 'A flow of ideas that evolves and never stops.' },
  { label: 'Interconnectedness & Conversation', sub: 'Perspectives meeting in a safe, open space.' },
  { label: 'Care & Nurturing', sub: 'A supportive, non-judgmental environment.' },
  { label: 'Progress & Possibility', sub: 'From one question, new directions unfold.' },
];

export default function LogoIntroOverlay() {
  const [visible, setVisible] = useState(false);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('unfoldinn_intro_seen')) return;
    } catch {
      // Ignore storage access restrictions
    }

    setVisible(true);

    const t1 = setTimeout(() => setBeat(1), 950);
    const t2 = setTimeout(() => setBeat(2), 1950);
    const t3 = setTimeout(() => setBeat(3), 2950);
    const t4 = setTimeout(() => setBeat(4), 3950);
    const tEnd = setTimeout(() => {
      try {
        sessionStorage.setItem('unfoldinn_intro_seen', '1');
      } catch {
        // Ignore
      }
      setVisible(false);
    }, 6000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tEnd);
    };
  }, []);

  const handleSkip = () => {
    try {
      sessionStorage.setItem('unfoldinn_intro_seen', '1');
    } catch {
      // Ignore
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="unfoldinn-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-6"
          style={{
            backgroundImage:
              'linear-gradient(153deg, rgb(238, 230, 255) 0%, rgb(250, 248, 255) 55%, rgb(252, 231, 214) 100%)',
          }}
        >
          {/* Skip Button */}
          <button
            type="button"
            onClick={handleSkip}
            className="absolute top-6 right-6 rounded-full border border-[#e5dfef] bg-white/80 px-4 py-2 font-wix-text text-[12px] font-medium text-[#686579] backdrop-blur transition-colors hover:border-[#29253a] hover:text-[#29253a]"
          >
            Skip intro →
          </button>

          {/* Animated Meaning Stage */}
          <div className="relative flex flex-col items-center text-center">
            <div className="relative flex h-[200px] w-[260px] items-center justify-center">
              {/* Beat 0: Curiosity Question Mark */}
              <motion.svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                fill="none"
                className="absolute"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: beat === 0 ? 1 : 0,
                  scale: beat === 0 ? 1 : 0.75,
                }}
                transition={{ duration: 0.45 }}
              >
                <motion.path
                  d="M36 35C36 25 43 19 52 19C61 19 67 25 67 33C67 41 60 45 53 50C49 53 49 58 49 62"
                  stroke="#3B3553"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: beat === 0 ? 1 : 0 }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                />
                <motion.circle
                  cx="49"
                  cy="76"
                  r="4.5"
                  fill="#F6B47D"
                  initial={{ scale: 0 }}
                  animate={{ scale: beat === 0 ? [0, 1.4, 1] : 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                />
              </motion.svg>

              {/* Beat 1: Continuous Thought (Infinity) */}
              <motion.svg
                width="140"
                height="90"
                viewBox="0 0 140 90"
                fill="none"
                className="absolute"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 1 ? 1 : 0, scale: beat === 1 ? 1 : 0.85 }}
                transition={{ duration: 0.4 }}
              >
                <motion.path
                  d="M42 45C42 29 56 22 70 45C84 68 98 61 98 45C98 29 84 22 70 45C56 68 42 61 42 45Z"
                  stroke="#765C9C"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: beat === 1 ? 1 : 0 }}
                  transition={{ duration: 0.85, ease: 'easeInOut' }}
                />
              </motion.svg>

              {/* Beat 2: Interconnectedness + Conversation Cloud */}
              <motion.svg
                width="160"
                height="110"
                viewBox="0 0 160 110"
                fill="none"
                className="absolute"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 2 ? 1 : 0, scale: beat === 2 ? 1 : 0.85 }}
                transition={{ duration: 0.4 }}
              >
                <motion.circle
                  cx="62"
                  cy="54"
                  r="24"
                  stroke="#3B3553"
                  strokeWidth="3.5"
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: beat === 2 ? 0 : -16, opacity: beat === 2 ? 1 : 0 }}
                  transition={{ duration: 0.55 }}
                />
                <motion.circle
                  cx="98"
                  cy="54"
                  r="24"
                  stroke="#807A9E"
                  strokeWidth="3.5"
                  initial={{ x: 16, opacity: 0 }}
                  animate={{ x: beat === 2 ? 0 : 16, opacity: beat === 2 ? 1 : 0 }}
                  transition={{ duration: 0.55 }}
                />
                <motion.path
                  d="M52 24C44 24 38 30 38 37C38 42 41 46 46 48L44 56L53 50C56 51 60 51 64 50"
                  stroke="#E39A5D"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: beat === 2 ? 1 : 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                />
              </motion.svg>

              {/* Beat 3: Care & Nurturing (Heart) */}
              <motion.svg
                width="110"
                height="100"
                viewBox="0 0 110 100"
                fill="none"
                className="absolute"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 3 ? 1 : 0, scale: beat === 3 ? [0.9, 1.08, 1] : 0.8 }}
                transition={{ duration: 0.5 }}
              >
                <motion.path
                  d="M55 82C55 82 22 61 22 39C22 27 31 20 41 20C48 20 53 24 55 29C57 24 62 20 69 20C79 20 88 27 88 39C88 61 55 82 55 82Z"
                  stroke="#E39A5D"
                  strokeWidth="4"
                  fill="rgba(246,180,125,0.22)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: beat === 3 ? 1 : 0 }}
                  transition={{ duration: 0.7 }}
                />
              </motion.svg>

              {/* Beat 4: Full Unfoldinn Logo + Progress & Possibility */}
              <motion.div
                className="absolute flex flex-col items-start"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: beat >= 4 ? 1 : 0, scale: beat >= 4 ? 1 : 0.85 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <svg
                  width="148"
                  height="114"
                  viewBox="0 0 57.2704 44.5394"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="overflow-visible"
                >
                  <motion.path
                    d={PATH_SWEEP_LOOP}
                    fill="#807A9E"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    stroke="#807A9E"
                    strokeWidth="0.6"
                    initial={{ pathLength: 0, fillOpacity: 0 }}
                    animate={{
                      pathLength: beat >= 4 ? 1 : 0,
                      fillOpacity: beat >= 4 ? 1 : 0,
                    }}
                    transition={{
                      pathLength: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
                      fillOpacity: { duration: 0.4, delay: 0.4 },
                    }}
                  />
                  <motion.path
                    d={PATH_INNER_LOOP}
                    fill="#3B3553"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    stroke="#3B3553"
                    strokeWidth="0.6"
                    initial={{ pathLength: 0, fillOpacity: 0 }}
                    animate={{
                      pathLength: beat >= 4 ? 1 : 0,
                      fillOpacity: beat >= 4 ? 1 : 0,
                    }}
                    transition={{
                      pathLength: { duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] },
                      fillOpacity: { duration: 0.4, delay: 0.55 },
                    }}
                  />
                </svg>
                <div className="-mt-2 flex items-center gap-2">
                  <motion.span
                    animate={{ scale: beat >= 4 ? [0, 1.35, 1] : 0 }}
                    transition={{ duration: 0.45, delay: 0.25 }}
                    className="h-3.5 w-3.5 rounded-full bg-[#f6b47d]"
                  />
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: beat >= 4 ? 1 : 0, x: beat >= 4 ? 0 : -8 }}
                    transition={{ duration: 0.45, delay: 0.45 }}
                    className="font-wix-display text-[32px] font-semibold tracking-[-0.03em]"
                  >
                    <span className="text-[#e39a5d]">Un</span>
                    <span className="text-[#29253a]">foldinn</span>
                  </motion.span>
                </div>
              </motion.div>
            </div>

            {/* Meaning Caption */}
            <div className="mt-6 min-h-[68px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={beat}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="font-wix-text text-[12px] font-bold uppercase tracking-[0.14em] text-[#765c9c]">
                    {MEANING_BEATS[beat]?.label}
                  </p>
                  <p className="mt-1.5 font-wix-display text-[20px] font-medium text-[#29253a] sm:text-[24px]">
                    {MEANING_BEATS[beat]?.sub}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 6-second Progress Bar */}
            <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-[#e5dfef]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#765c9c] via-[#e39a5d] to-[#29253a]"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 5.9, ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
