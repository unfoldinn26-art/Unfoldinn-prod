'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';
import { EASE } from './ui/motion';
import Arrow from './ui/Arrow';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { useUserAuth } from '../context/UserAuthContext';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'For Students', path: '/for-students' },
  { name: 'For Parents', path: '/for-parents' },
  { name: 'For Institutions', path: '/for-institutions' },
  { name: 'How It Works', path: '/how-it-works' },
  { name: 'About Deepak', path: '/about' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, remainingCredits } = useUserAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close overlay on route change, lock scroll while open.
  useEffect(() => setIsOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const isActive = (p) =>
    p === '/' ? pathname === '/' : pathname === p || pathname?.startsWith(p + '/');
  const firstName = user?.name ? user.name.split(' ')[0] : 'Account';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-nav px-2.5 pt-2.5 sm:px-4 sm:pt-4 md:px-6 md:pt-5">
        <div
          className={`mx-auto flex max-w-page items-center justify-between gap-2 sm:gap-4 rounded-full border pl-3.5 sm:pl-5 pr-1.5 sm:pr-2 py-1.5 sm:py-2 transition-[background-color,border-color,box-shadow] duration-500 ease-editorial ${
            scrolled || isOpen
              ? 'border-line bg-paper/90 dark:bg-[#111822]/95 dark:border-white/10 dark:shadow-black/50 backdrop-blur-xl shadow-sm'
              : 'border-transparent bg-transparent'
          }`}
        >
          <Link href="/" className="shrink-0" aria-label="Unfoldinn home">
            <Logo size="sm" showTagline={false} />
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1" aria-label="Primary">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`relative rounded-full px-2.5 xl:px-3 py-1.5 text-[0.8125rem] transition-colors duration-300 ${
                  isActive(link.path) ? 'text-ink dark:text-white font-semibold' : 'text-muted hover:text-ink dark:text-slate-300 dark:hover:text-white font-medium'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-2.5 xl:inset-x-3 -bottom-px h-0.5 bg-signal rounded-full"
                    transition={{ duration: 0.5, ease: EASE }}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-2 rounded-full border border-line bg-paper/90 hover:border-ink/40 px-3.5 py-1.5 text-[0.78rem] font-medium text-ink transition-colors min-h-[36px]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-signal/15 text-signal font-bold text-[10px]">
                  {firstName.charAt(0).toUpperCase()}
                </span>
                <span>{firstName}</span>
                {remainingCredits > 0 && (
                  <span className="rounded-full bg-sprout/15 px-2 py-0.5 font-mono text-[10px] font-bold text-sprout">
                    {remainingCredits} Cr
                  </span>
                )}
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] font-medium text-muted hover:text-ink dark:text-slate-300 dark:hover:text-white transition-colors min-h-[36px]"
              >
                <User className="h-3.5 w-3.5 text-signal" />
                <span>Sign In</span>
              </Link>
            )}

            <ThemeToggle variant="icon" className="hidden sm:inline-flex" />

            <Link
              href="/book"
              className="group hidden sm:inline-flex items-center gap-2.5 rounded-full bg-ink dark:bg-white pl-4 pr-1 py-1 text-[0.8125rem] font-medium text-paper dark:text-[#0E1318] transition-[transform,background-color] duration-500 ease-editorial hover:bg-ink-2 dark:hover:bg-slate-100 active:scale-[0.98] min-h-[36px]"
            >
              <span>{isAuthenticated ? 'Book Session' : 'Start a Conversation'}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper/10 transition-transform duration-500 ease-editorial group-hover:translate-x-0.5">
                <Arrow className="h-3 w-3" />
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              className="lg:hidden relative flex h-11 w-11 items-center justify-center rounded-full border border-line dark:border-white/15 bg-paper/90 dark:bg-[#141B24] backdrop-blur-md transition-transform active:scale-[0.95]"
            >
              <span
                className={`absolute h-0.5 w-4 bg-ink dark:bg-white transition-transform duration-500 ease-editorial ${
                  isOpen ? 'rotate-45' : '-translate-y-[3.5px]'
                }`}
              />
              <span
                className={`absolute h-0.5 w-4 bg-ink transition-transform duration-500 ease-editorial ${
                  isOpen ? '-rotate-45' : 'translate-y-[3.5px]'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-0 z-overlay flex flex-col bg-paper/98 dark:bg-[#0E1318]/98 backdrop-blur-2xl lg:hidden overflow-y-auto"
          >
            <nav className="page-x flex flex-1 flex-col justify-between pt-20 sm:pt-24 pb-8" aria-label="Mobile">
              <ul className="border-t border-line mt-4">
                {[
                  ...navLinks,
                  { name: 'Contact', path: '/contact' },
                  isAuthenticated
                    ? { name: `My Dashboard (${firstName})`, path: '/dashboard' }
                    : { name: 'Sign In / Create Account', path: '/login' }
                ].map((link, i) => (
                  <motion.li
                    key={link.path}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.04 + i * 0.035 }}
                    className="border-b border-line"
                  >
                    <Link
                      href={link.path}
                      onClick={() => setIsOpen(false)}
                      className="group flex items-baseline justify-between py-3.5 sm:py-4 active:bg-paper-2/50 px-1 rounded-lg"
                    >
                      <span
                        className={`font-serif text-[1.75rem] sm:text-[2rem] leading-none tracking-[-0.02em] ${
                          isActive(link.path) ? 'text-signal font-normal' : 'text-ink'
                        }`}
                      >
                        {link.name}
                      </span>
                      <span className="meta">{String(i + 1).padStart(2, '0')}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.35 }}
                className="mt-8 flex flex-col gap-3 pt-4 border-t border-line/60"
              >
                <Link
                  href="/book"
                  onClick={() => setIsOpen(false)}
                  className="group inline-flex items-center justify-between rounded-full bg-ink pl-6 pr-2 py-2 font-medium text-paper active:scale-[0.98] w-full shadow-sm"
                >
                  <span className="text-[0.9375rem]">{isAuthenticated ? 'Book Next Session' : 'Start a Conversation'}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/10">
                    <Arrow className="h-3.5 w-3.5" />
                  </span>
                </Link>
                {isAuthenticated && remainingCredits > 0 && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-sprout/15 px-4 py-2.5 text-xs font-mono font-bold text-sprout"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-sprout inline-block" />
                    <span>{remainingCredits} Credits Active</span>
                  </Link>
                )}
                <div className="pt-2">
                  <ThemeToggle variant="pill" />
                </div>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
