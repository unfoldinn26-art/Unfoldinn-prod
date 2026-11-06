'use client';

import { motion } from 'framer-motion';
import { Reveal, RevealGroup, RevealItem } from '../ui/Reveal';

const OUTCOMES = [
  {
    step: '01',
    title: 'Clarity',
    colorKey: 'sun',
    headerBg: 'bg-[#C8792C]',
    cardBg: 'bg-[#FAF0E1] dark:bg-[#15110D]',
    borderColor: 'border-[#F4D9A0] dark:border-[#C8792C]/30',
    textColor: 'text-[#9B5113] dark:text-amber-300',
    desc: 'Gaining profound self-awareness and direction. Clearer understanding of the next step and the reasons behind it.',
    quote: '“I finally see my path clearly.”',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden="true">
        {/* Geometric Perspective Lens / Clarity Prism */}
        <polygon points="24,6 40,15 40,33 24,42 8,33 8,15" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <polygon points="24,14 34,20 34,28 24,34 14,28 14,20" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" opacity="0.6" />
        <circle cx="24" cy="24" r="4.5" fill="currentColor" opacity="0.8" />
        <line x1="24" y1="6" x2="24" y2="14" stroke="currentColor" strokeWidth="1.2" />
        <line x1="24" y1="34" x2="24" y2="42" stroke="currentColor" strokeWidth="1.2" />
        <line x1="8" y1="24" x2="14" y2="24" stroke="currentColor" strokeWidth="1.2" />
        <line x1="34" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Confidence',
    colorKey: 'coral',
    headerBg: 'bg-[#C85236]',
    cardBg: 'bg-[#FBF0EC] dark:bg-[#160E0B]',
    borderColor: 'border-[#F2C2B5] dark:border-[#C85236]/30',
    textColor: 'text-[#9B3921] dark:text-rose-300',
    desc: 'Building belief in abilities and potential. Greater willingness to participate, ask questions, and approach opportunities.',
    quote: '“I now trust my skills and value.”',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden="true">
        {/* Rising Sunrise Arc & Radiating Beams */}
        <path d="M12 28C12 21.3726 17.3726 16 24 16C30.6274 16 36 21.3726 36 28" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="6" y1="28" x2="42" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="6" y1="33" x2="42" y2="33" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
        <line x1="24" y1="9" x2="24" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="13" x2="16.5" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="34" y1="13" x2="31.5" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="21" x2="12" y2="22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="40" y1="21" x2="36" y2="22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Exposure',
    colorKey: 'sprout',
    headerBg: 'bg-[#38784E]',
    cardBg: 'bg-[#EEF6F0] dark:bg-[#0E1410]',
    borderColor: 'border-[#BFE0C8] dark:border-[#38784E]/30',
    textColor: 'text-[#265636] dark:text-emerald-300',
    desc: 'Discovering new pathways and perspectives. Interaction with people, opportunities, and ideas previously unfamiliar.',
    quote: '“Opened my eyes to possibilities I never imagined.”',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden="true">
        {/* Compass Rose & Pathways */}
        <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="1.8" />
        <polygon points="24,10 27,21 38,24 27,27 24,38 21,27 10,24 21,21" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="24" cy="24" r="2.5" fill="currentColor" />
        <text x="24" y="8" textAnchor="middle" fontSize="6" fontFamily="monospace" fill="currentColor">N</text>
        <text x="43" y="26" textAnchor="middle" fontSize="6" fontFamily="monospace" fill="currentColor">E</text>
        <text x="24" y="44" textAnchor="middle" fontSize="6" fontFamily="monospace" fill="currentColor">S</text>
        <text x="5" y="26" textAnchor="middle" fontSize="6" fontFamily="monospace" fill="currentColor">W</text>
      </svg>
    ),
  },
  {
    step: '04',
    title: 'Action',
    colorKey: 'gold',
    headerBg: 'bg-[#D49826]',
    cardBg: 'bg-[#FDF9ED] dark:bg-[#16130A]',
    borderColor: 'border-[#F6E19E] dark:border-[#D49826]/30',
    textColor: 'text-[#A07010] dark:text-amber-300',
    desc: 'Taking tangible steps towards real goals daily. Completion of agreed exploration or self-development action steps.',
    quote: '“Creating consistent, meaningful progress every day.”',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden="true">
        {/* 7-Day Checklist & Progress Board */}
        <rect x="12" y="8" width="24" height="32" rx="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M18 16H30" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="16" y="21" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <path d="M17.5 23.2L19 24.5L22.5 20.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="24" y1="23.5" x2="31" y2="23.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="16" y="29" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <path d="M17.5 31.2L19 32.5L22.5 28.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="24" y1="31.5" x2="31" y2="31.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    step: '05',
    title: 'Ownership',
    colorKey: 'sky',
    headerBg: 'bg-[#2B6A8F]',
    cardBg: 'bg-[#EAF3F8] dark:bg-[#14110E]',
    borderColor: 'border-[#B5D8EB] dark:border-[#C8792C]/25',
    textColor: 'text-[#1B4D6B] dark:text-[#E2D9CC]',
    desc: 'Embracing responsibility for your unique journey. Increasingly evidence-based, mature decisions made independently.',
    quote: '“This is my path, and I am leading the way.”',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden="true">
        {/* Open Horizon Highway & Radiating Light */}
        <line x1="6" y1="30" x2="42" y2="30" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <polygon points="12,42 21,30 27,30 36,42" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.6" />
        <line x1="24" y1="33" x2="24" y2="39" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2" />
        <line x1="24" y1="12" x2="24" y2="25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="16" y1="16" x2="21" y2="26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="32" y1="16" x2="27" y2="26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="10" y1="22" x2="18" y2="28" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="38" y1="22" x2="30" y2="28" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

/**
 * 5 Student Outcomes Transformation Grid.
 * Direct implementation of the Section 1 Design Comp with 5 colorful, graphic pillars:
 * Clarity, Confidence, Exposure, Action, Ownership.
 */
export default function StudentOutcomesGrid({ className = '' }) {
  return (
    <div className={`w-full ${className}`}>
      {/* 5-Pillar Responsive Transformation Grid */}
      <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
        {OUTCOMES.map((item, idx) => (
          <RevealItem
            key={item.title}
            className={`group flex flex-col justify-between rounded-2xl border ${item.borderColor} ${item.cardBg} p-6 sm:p-7 transition-all duration-500 ease-editorial hover:shadow-xl hover:-translate-y-1 relative overflow-hidden`}
          >
            {/* Top Step Pill & Graphic Symbol */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-semibold ${item.textColor} bg-white/80 dark:bg-white/10 border ${item.borderColor}`}>
                  Pillar {item.step}
                </span>
                <span className={`w-2 h-2 rounded-full ${item.headerBg}`} />
              </div>

              {/* Graphic Icon Box with Soft Tint */}
              <div className={`mb-6 flex items-center justify-center p-4 rounded-2xl bg-white/70 dark:bg-white/5 ${item.textColor} transition-transform duration-500 group-hover:scale-105 border ${item.borderColor}`}>
                {item.icon}
              </div>

              {/* Pillar Title */}
              <h3 className="font-serif text-[1.75rem] text-ink dark:text-white leading-tight tracking-[-0.01em]">
                {item.title}
              </h3>

              {/* Narrative Description */}
              <p className="mt-3 text-[0.9375rem] text-ink/80 dark:text-[#D6CEBF] leading-relaxed font-sans">
                {item.desc}
              </p>
            </div>

            {/* Bottom Student Voice Quote */}
            <div className={`mt-8 pt-4 border-t ${item.borderColor}`}>
              <p className={`font-serif italic text-[0.9375rem] leading-snug ${item.textColor}`}>
                {item.quote}
              </p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}
