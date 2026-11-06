'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Arrow from '../ui/Arrow';

const DILEMMAS = [
  {
    id: 'career',
    label: '“I don’t know what career to choose”',
    pillColor: 'bg-amber-soft border-amber-200 text-amber-deep',
    activePill: 'bg-signal text-paper border-signal shadow-sm',
    bg: 'bg-amber-soft/50',
    border: 'border-amber-200',
    text: 'text-amber-deep',
    question: '“Everyone else seems to have a clear roadmap. Where do I even begin?”',
    insight: 'Career confusion can come from different places—too many choices, limited exposure, expectations from others, or simply not knowing yourself well enough yet. Understanding where your confusion is coming from can be a useful first step. Perhaps this is where a conversation can begin.',
    invitation: 'Perhaps this is where a conversation can begin.'
  },
  {
    id: 'confidence',
    label: '“Good at studies, but low on confidence”',
    pillColor: 'bg-signalSoft border-amber-200 text-signalDeep',
    activePill: 'bg-signalDeep text-paper border-signalDeep shadow-sm',
    bg: 'bg-signalSoft/50',
    border: 'border-amber-200',
    text: 'text-signalDeep',
    question: '“I get good marks, but in interviews or group settings, I freeze.”',
    insight: 'Academic performance and personal confidence often develop differently. Scoring well is one skill; trusting your voice in unfamiliar rooms is another. Recognizing where the hesitation comes from is often where real self-belief begins to take shape.',
    invitation: 'A safe, non-judgmental space to understand and build confidence.'
  },
  {
    id: 'parents',
    label: '“Parents want one thing, I want another”',
    pillColor: 'bg-sky-soft border-sky-border text-sky',
    activePill: 'bg-sky text-paper border-sky shadow-sm',
    bg: 'bg-sky-soft/50',
    border: 'border-sky-border',
    text: 'text-sky',
    question: '“How do I pursue my interests without causing conflict at home?”',
    insight: 'Differences with family often stem from care and concern rather than a desire to control. Finding ways to understand their perspective while clarifying your own can help transform tension into constructive dialogue.',
    invitation: 'Explore how to bridge expectations with personal clarity.'
  },
  {
    id: 'exposure',
    label: '“I have no exposure beyond my classroom”',
    pillColor: 'bg-sprout-soft border-sprout-border text-sprout',
    activePill: 'bg-sprout text-paper border-sprout shadow-sm',
    bg: 'bg-sprout-soft/50',
    border: 'border-sprout-border',
    text: 'text-sprout',
    question: '“How do I discover fellowships, startups, and unconventional opportunities?”',
    insight: 'Most meaningful opportunities and career pathways are rarely discussed inside a standard syllabus. Discovering what exists begins with curiosity, asking better questions, and connecting with people beyond familiar circles.',
    invitation: 'Open your perspective to opportunities you haven’t yet encountered.'
  },
  {
    id: 'transition',
    label: '“About to graduate, don’t know what comes next”',
    pillColor: 'bg-signalSoft border-amber-200 text-signalDeep',
    activePill: 'bg-signalDeep text-paper border-signalDeep shadow-sm',
    bg: 'bg-signalSoft/50',
    border: 'border-amber-200',
    text: 'text-signalDeep',
    question: '“College is ending, and the real world feels overwhelming.”',
    insight: 'Reaching the end of university without a definitive roadmap is far more common than people admit. Transition is not about having the next twenty years mapped out—it is about seeing your very next step clearly and taking it with confidence.',
    invitation: 'One conversation can help bring focus to what comes next.'
  }
];

export default function StudentCrossroads() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeDilemma = DILEMMAS[activeIndex];

  return (
    <section id="crossroads" className="scroll-mt-24 border-t border-line bg-paper-2/40 dark:bg-[#0B0F14] py-16 sm:py-24 md:py-32">
      <div className="page-x max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <span className="meta block mb-2">Interactive Student Navigator</span>
            <h2 className="font-serif text-[clamp(1.75rem,3.4vw,3.25rem)] text-ink font-normal leading-[1.08] tracking-[-0.02em]">
              Where are you right now?
            </h2>
          </div>
          <p className="text-[0.8125rem] sm:text-[0.875rem] text-muted max-w-xs sm:text-right">
            Click any question below to see how a thoughtful conversation begins.
          </p>
        </div>

        {/* Dilemma Selector Chips */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto no-scrollbar pb-2 sm:pb-0 sm:flex-wrap -mx-4 px-4 sm:mx-0 sm:px-0">
          {DILEMMAS.map((d, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-[0.75rem] sm:text-xs font-medium transition-all duration-300 ease-editorial min-h-[38px] sm:min-h-[42px] inline-flex items-center shrink-0 whitespace-nowrap sm:whitespace-normal ${
                  isActive
                    ? `${d.activePill} scale-[1.02]`
                    : 'border border-line dark:border-white/10 bg-paper dark:bg-[#141B24] text-ink dark:text-slate-200 hover:border-ink/40 dark:hover:border-white/30'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Machined Double-Bezel Perspective Container */}
        <div className="rounded-[1.5rem] sm:rounded-[2rem] p-1.5 sm:p-2 bg-mocha/5 dark:bg-white/[0.03] border border-line dark:border-white/10 ring-1 ring-black/5 dark:ring-white/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDilemma.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-[calc(1.5rem-0.375rem)] sm:rounded-[calc(2rem-0.375rem)] p-4 sm:p-8 md:p-10 border ${activeDilemma.border} ${activeDilemma.bg} dark:bg-[#141B24] dark:border-white/15 dark:shadow-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] relative overflow-hidden`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                <span className={`px-3 py-0.5 sm:py-1 rounded-full text-[0.6875rem] sm:text-xs font-mono font-medium border bg-paper dark:bg-white/10 dark:border-white/15 dark:text-amber-300 ${activeDilemma.border} ${activeDilemma.text}`}>
                  {activeDilemma.label.replace(/[“”]/g, '')}
                </span>
                <span className="text-[0.6875rem] sm:text-xs font-mono text-muted">• Mentor Perspective</span>
              </div>

              <h3 className="font-serif text-[1.375rem] sm:text-[1.85rem] md:text-[2.125rem] text-ink dark:text-white font-normal leading-snug mb-3 sm:mb-4">
                {activeDilemma.question}
              </h3>

              <p className="text-[0.9375rem] sm:text-[1.0625rem] text-ink-2 dark:text-slate-300 leading-relaxed max-w-3xl">
                {activeDilemma.insight}
              </p>

              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <span className={`text-xs sm:text-[0.875rem] font-medium ${activeDilemma.text} dark:text-amber-400`}>
                  {activeDilemma.invitation}
                </span>
                <Link
                  href="/book"
                  className="group inline-flex items-center gap-2 text-xs font-mono font-bold text-ink hover:text-signal dark:text-white dark:hover:text-amber-400 transition-colors shrink-0 py-1"
                >
                  <span>Start a conversation with Deepak</span>
                  <Arrow className="h-3 w-3 transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
