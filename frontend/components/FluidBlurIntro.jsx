'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WORDS = ['Clarity.', 'Perspective.', 'UNFOLDINN'];

// Monochromatic floating glass bubbles
const FLOATING_BUBBLES = [
  { size: 110, x: '14%', y: '24%', dur: 6.5, delay: 0, ampY: -16 },
  { size: 160, x: '76%', y: '19%', dur: 7.5, delay: 0.6, ampY: 20 },
  { size: 85, x: '19%', y: '70%', dur: 5.8, delay: 1.2, ampY: -12 },
  { size: 140, x: '80%', y: '66%', dur: 7.0, delay: 0.3, ampY: 15 },
  { size: 65, x: '46%', y: '14%', dur: 6.0, delay: 1.5, ampY: -10 },
  { size: 80, x: '50%', y: '80%', dur: 6.2, delay: 0.8, ampY: 14 },
];

export default function FluidBlurIntro({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Only play if explicitly triggered via custom event (e.g., from footer replay button)
    const handleTrigger = () => {
      setIsPlaying(true);
      setCurrentIndex(0);
      const t1 = setTimeout(() => setCurrentIndex(1), 900);
      const t2 = setTimeout(() => setCurrentIndex(2), 1800);
      const t3 = setTimeout(() => {
        handleFinish();
      }, 2850);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    };

    window.addEventListener('replay_si_intro', handleTrigger);
    return () => window.removeEventListener('replay_si_intro', handleTrigger);
  }, []);

  const handleFinish = () => {
    setIsPlaying(false);
    if (onComplete) onComplete();
  };

  if (!isPlaying) return null;

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          key="fluid-blur-intro"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            filter: 'blur(24px)',
            scale: 1.02,
            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white text-black select-none cursor-pointer px-6 overflow-hidden"
          onClick={handleFinish}
        >
          {/* Subtle Corner Black-White Fluid Blurs (Light, not overpowering) */}
          {/* Top-Left: Subtle dark ink fluid diffusion */}
          <motion.div
            animate={{
              scale: [1, 1.12, 1],
              x: [-12, 12, -12],
              y: [-8, 10, -8],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-24 -left-24 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-black/[0.09] via-neutral-900/[0.04] to-transparent filter blur-[80px] pointer-events-none"
          />

          {/* Bottom-Right: Subtle dark ink fluid diffusion */}
          <motion.div
            animate={{
              scale: [1.12, 1, 1.12],
              x: [12, -12, 12],
              y: [10, -8, 10],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-28 -right-28 w-88 h-88 sm:w-[26rem] sm:h-[26rem] rounded-full bg-gradient-to-tl from-black/[0.09] via-neutral-900/[0.04] to-transparent filter blur-[90px] pointer-events-none"
          />

          {/* Top-Right: Delicate frosted white highlight fluid */}
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.4, 0.65, 0.4],
            }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-gradient-to-bl from-neutral-200/50 via-white/30 to-transparent filter blur-[70px] pointer-events-none"
          />

          {/* Bottom-Left: Delicate frosted white highlight fluid */}
          <motion.div
            animate={{
              scale: [1.08, 1, 1.08],
              opacity: [0.35, 0.6, 0.35],
            }}
            transition={{ duration: 7.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-gradient-to-tr from-neutral-200/50 via-white/30 to-transparent filter blur-[70px] pointer-events-none"
          />

          {/* Floating Monochromatic Glass Bubble Elements */}
          {FLOATING_BUBBLES.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{
                opacity: [0.3, 0.55, 0.3],
                y: [0, b.ampY, 0],
                x: [0, b.ampY * 0.35, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                opacity: { duration: 0.8, delay: b.delay },
                scale: { duration: b.dur, repeat: Infinity, ease: 'easeInOut', delay: b.delay },
                y: { duration: b.dur, repeat: Infinity, ease: 'easeInOut', delay: b.delay },
                x: { duration: b.dur * 1.2, repeat: Infinity, ease: 'easeInOut', delay: b.delay },
              }}
              style={{
                width: b.size,
                height: b.size,
                left: b.x,
                top: b.y,
              }}
              className="absolute rounded-full bg-gradient-to-br from-white/80 via-neutral-100/40 to-neutral-200/30 backdrop-blur-md border border-neutral-300/40 shadow-[0_8px_30px_rgba(0,0,0,0.03)] pointer-events-none flex items-start justify-start p-2"
            >
              {/* Monochromatic specular reflection point */}
              <div className="w-2 h-2 rounded-full bg-white/95 shadow-sm" />
            </motion.div>
          ))}

          {/* Center Morphing Liquid Reactor Bubble behind the text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={`bubble-${currentIndex}`}
                initial={{
                  scale: 0.8,
                  opacity: 0,
                  rotate: -8,
                  borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
                }}
                animate={{
                  scale: [0.85, 1.05, 1],
                  opacity: 0.75,
                  rotate: [ -8, 4, 0 ],
                  borderRadius: [
                    '60% 40% 70% 30% / 50% 60% 40% 50%',
                    '40% 60% 30% 70% / 60% 40% 60% 40%',
                    '52% 48% 62% 38% / 46% 54% 46% 54%',
                  ],
                }}
                exit={{
                  scale: 1.15,
                  opacity: 0,
                  rotate: 8,
                  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="w-72 h-72 sm:w-96 sm:h-96 md:w-[32rem] md:h-[32rem] bg-gradient-to-tr from-neutral-100/90 via-white/60 to-neutral-200/40 backdrop-blur-xl border border-neutral-200/70 shadow-[0_24px_70px_rgba(0,0,0,0.04)]"
              />
            </AnimatePresence>
          </div>

          {/* Center Text Container with PopLayout 0.5s Optical Blur Morph */}
          <div className="relative z-10 w-full max-w-4xl h-44 flex items-center justify-center pointer-events-none">
            <AnimatePresence mode="popLayout">
              <motion.h1
                key={WORDS[currentIndex]}
                initial={{
                  opacity: 0,
                  filter: 'blur(36px)',
                  scale: 0.9,
                  letterSpacing: '0.05em',
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  filter: 'blur(0px)',
                  scale: 1,
                  letterSpacing: '-0.02em',
                  y: 0,
                  transition: {
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  },
                }}
                exit={{
                  opacity: 0,
                  filter: 'blur(32px)',
                  scale: 1.08,
                  letterSpacing: '0.04em',
                  y: -10,
                  transition: {
                    duration: 0.5,
                    ease: [0.4, 0, 0.2, 1],
                  },
                }}
                className="absolute inset-0 flex items-center justify-center font-serif font-normal text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-neutral-950 text-center tracking-[-0.03em]"
              >
                {WORDS[currentIndex]}
              </motion.h1>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
