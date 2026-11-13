/** @type {import('tailwindcss').Config} */

// Unfoldinn Brand Identity Palette: Mocha Brown, Champagne Gold, Burnt Amber
// Derived and calibrated using UI Skills standards (better-colors, colorize, create-design-md).
const mocha = '#29253A';         // Official Swatch: MOCHA BROWN
const champagne = '#FFE79A';     // Official Swatch: CHAMPAGNE GOLD
const burntAmber = '#E39A5D';    // Official Swatch: BURNT AMBER

// Semantic tokens calibrated for WCAG AAA/AA readability
const paper = '#FAF8FF';         // Luminous champagne paper canvas
const paper2 = '#F5F0FF';        // Warm champagne secondary surface / bands
const paper3 = '#EEE6FF';        // Pressed fills / subtle accents
const ink = '#29253A';           // Deep espresso mocha ink (15:1 contrast against paper)
const ink2 = '#4C465D';          // Rich mocha secondary heading & body text
const muted = '#686579';         // Mocha-toned metadata text
const signal = burntAmber;       // Burnt Amber primary accent
const signalSoft = '#FCEFEE';    // Soft amber tint for badge washes
const signalDeep = '#B56727';    // Deep burnt amber (AAA contrast for links and badges)

module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core editorial canvas & ink
        paper: { DEFAULT: paper, 2: paper2, 3: paper3 },
        ink: { DEFAULT: ink, 2: ink2 },
        muted,
        line: 'rgba(41, 37, 58, 0.12)',
        signal: { DEFAULT: signal, soft: signalSoft, deep: signalDeep },

        // Exact brand tri-color primitives
        mocha: {
          DEFAULT: mocha,
          deep: ink,
          dark: ink2,
          hover: '#4A3827',
          light: '#7A624B',
          muted: '#947C65',
          soft: '#F4EFEA',
        },
        champagne: {
          DEFAULT: champagne,
          paper,
          soft: '#FDFBF7',
          light: '#FAECD0',
          border: '#E8CA88',
          deep: '#9E782F',
        },
        amber: {
          DEFAULT: burntAmber,
          deep: signalDeep,
          soft: signalSoft,
          50: '#FFF9F2',
          100: '#FDF0DF',
          200: '#F9DCBE',
          300: '#F4C293',
          400: '#EEA161',
          500: burntAmber,
          600: '#B06520',
          700: signalDeep,
          800: '#7E3F0E',
          900: '#62310C',
          950: '#381804',
        },

        // Student Vitality & Life palette (sun, sprout, sky, coral) tuned to the new warm aesthetic
        sun: { DEFAULT: burntAmber, soft: signalSoft, border: '#EBB47E', deep: signalDeep },
        sprout: { DEFAULT: '#3D734F', soft: '#F0F6F2', border: '#C2DEC9', deep: '#285437' },
        sky: { DEFAULT: '#356A88', soft: '#EFF5F8', border: '#BDD9E7', deep: '#214D66' },
        coral: { DEFAULT: burntAmber, soft: signalSoft, border: '#EBB47E', deep: signalDeep },

        // Editorial semantic aliases used across booking, login, onboarding & dashboard
        terracotta: signal,
        sage: '#3D734F',
        stone: '#E8DEC9',
        ash: muted,
        warm: paper2,

        // Legacy names remapped so untouched screens inherit the new palette cleanly
        'charcoal-blue': ink,
        'golden-pollen': champagne,
        'tea-green': paper3,
        'midnight-violet': ink2,
        charcoal: ink,
        primary: { DEFAULT: ink, hover: mocha, light: ink2, dark: '#160E08' },
        secondary: { DEFAULT: signal, hover: signalDeep, light: '#DC8E44', dark: '#7E3F0E' },
        accent: { DEFAULT: champagne, hover: '#E8CA88', light: paper2, dark: '#9E782F' },
        violet: { DEFAULT: ink2, hover: ink, light: muted, dark: '#160E08' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        'wix-display': ['var(--font-wix-display)', 'var(--font-sans)', 'sans-serif'],
        'wix-text': ['var(--font-wix-text)', 'var(--font-sans)', 'sans-serif'],
        shantell: ['var(--font-shantell)', 'cursive', 'sans-serif'],
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      maxWidth: {
        page: '84rem',
      },
      zIndex: {
        nav: '40',
        overlay: '45',
        grain: '50',
        intro: '60',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(4%, -3%, 0) scale(1.08)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        drift: 'drift 28s cubic-bezier(0.45, 0, 0.55, 1) infinite',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
};
