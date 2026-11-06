'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ variant = 'icon', className = '' }) {
  const { theme, isDark, toggleTheme, setTheme, mounted } = useTheme();

  // Segmented pill variant (ideal for mobile menu or settings)
  if (variant === 'pill') {
    return (
      <div className={`flex items-center justify-between p-3 rounded-xl border border-line bg-paper-2 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted">
          {isDark ? <Moon className="w-3.5 h-3.5 text-signal" /> : <Sun className="w-3.5 h-3.5 text-signal" />}
          <span>Theme</span>
        </div>
        <div className="inline-flex p-0.5 rounded-lg border border-line bg-paper">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all duration-200 ${
              !isDark
                ? 'bg-ink text-paper shadow-xs font-semibold'
                : 'text-muted hover:text-ink'
            }`}
            aria-pressed={!isDark}
          >
            <Sun className="w-3 h-3" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all duration-200 ${
              isDark
                ? 'bg-ink text-paper shadow-xs font-semibold'
                : 'text-muted hover:text-ink'
            }`}
            aria-pressed={isDark}
          >
            <Moon className="w-3 h-3" />
            <span>Dark</span>
          </button>
        </div>
      </div>
    );
  }

  // Footer variant (quiet inline editorial button)
  if (variant === 'footer') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
        className={`group inline-flex items-center gap-2 text-[0.8125rem] text-muted hover:text-ink transition-colors min-h-[36px] ${className}`}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line bg-paper group-hover:border-ink/40 transition-colors">
          {mounted && isDark ? (
            <Sun className="h-3 w-3 text-signal" />
          ) : (
            <Moon className="h-3 w-3 text-muted group-hover:text-ink" />
          )}
        </span>
        <span className="font-mono text-xs">
          {mounted && isDark ? 'Light mode' : 'Dark mode'}
        </span>
      </button>
    );
  }

  // Default compact icon variant (for Navbar)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper/90 hover:border-ink/40 text-ink transition-all duration-300 ease-editorial active:scale-95 shadow-2xs ${className}`}
    >
      {mounted && isDark ? (
        <Sun className="h-4 w-4 text-signal transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-muted hover:text-ink transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
