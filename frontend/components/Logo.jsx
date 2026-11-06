'use client';

/**
 * Hand-crafted Artisanal Logo for Unfoldinn — Draft 4: The Zen Ensō & Morning Sun.
 * Features an organic, hand-drawn calligraphic Ensō brush circle embracing a warm watercolor
 * saffron sunrise in the center, with a discreet terracotta seal stamp.
 * Symbolizes clarity, deep listening, wisdom, and life-giving new beginnings.
 */
export default function Logo({
  size = 'md',
  showText = true,
  showTagline = false,
  className = '',
}) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-[1.125rem]',
    md: 'text-[1.3125rem]',
    lg: 'text-[1.75rem]',
    xl: 'text-[2.25rem]',
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Hand-crafted calligraphic Ensō & Saffron Dawn Mark */}
      <div className={`relative shrink-0 ${iconSizes[size] || iconSizes.md} flex items-center justify-center`}>
        <svg
          viewBox="0 0 54 54"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* Soft watercolor sunrise radial gradient */}
            <radialGradient id="ensoSunGlow" cx="50%" cy="58%" r="48%" fx="50%" fy="55%">
              <stop offset="0%" stopColor="#F4D9A0" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#E69F55" stopOpacity="0.75" />
              <stop offset="75%" stopColor="#C8792C" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#C8792C" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Glowing Saffron Watercolor Sun in Center */}
          <circle cx="27" cy="29" r="14" fill="url(#ensoSunGlow)" />

          {/* Hand-drawn organic watercolor sunrise texture splashes */}
          <path
            d="M20 28C22 25 32 24 35 28C33 32 23 33 20 28Z"
            fill="#C8792C"
            fillOpacity="0.3"
          />

          {/* The Calligraphic Sumi-e Ensō Brush Circle (Natural Open Stroke) */}
          {/* Main brush body: Thick bottom-left foundation tapering gracefully to top-right */}
          <path
            d="M17.5 40.5C12 36.5 8.5 31.5 8.5 25.5C8.5 15.5 16.5 7.5 26.5 7.5C36 7.5 43.5 14.5 44.5 23.5C45.2 29.5 42 35.5 37 39.5"
            className="stroke-[#5B4632] dark:stroke-[#F3EBDD]"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Secondary organic bristle stroke reinforcing hand-crafted ink texture */}
          <path
            d="M15 39C10.5 35 7.5 30 7.8 24.5C8.2 16 15.5 8.5 25.5 8.2C34.5 8 42 14.5 43.2 23"
            className="stroke-[#5B4632] dark:stroke-[#F3EBDD]"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
          {/* Ink press foundation at bottom-left */}
          <path
            d="M13 37.5C14.5 40 18 42.5 22 43.5C26 44.5 29 44 31 43.5"
            className="stroke-[#5B4632] dark:stroke-[#F3EBDD]"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Artisanal Terracotta Seal / Stamp (Hanko seal mark) */}
          <rect x="37" y="36" width="7.5" height="7.5" rx="1.5" fill="#C8792C" />
          <path d="M39.5 38.5H42M40.75 38.5V41.5M39.5 41.5H42" stroke="#FAF6EE" strokeWidth="0.8" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-serif tracking-[-0.015em] text-ink leading-none ${textSizes[size] || textSizes.md}`}>
            Unfoldinn
          </span>
          {showTagline && (
            <span className="font-mono text-[0.625rem] tracking-[0.12em] uppercase text-muted mt-1">
              Young Minds. New Perspectives. Wider Possibilities.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
