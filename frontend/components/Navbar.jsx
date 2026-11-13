'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X } from 'lucide-react';
import { EASE } from './ui/motion';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { useUserAuth } from '../context/UserAuthContext';

const navLinks = [
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
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setIsOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isActive = (p) =>
    p === '/' ? pathname === '/' : pathname === p || pathname?.startsWith(p + '/');
  const firstName = user?.name ? user.name.split(' ')[0] : 'Account';

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-nav transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_4px_20px_rgba(41,37,58,0.08)]' : 'shadow-[0_1px_3px_rgba(25,33,61,0.06)]'
        } bg-gradient-to-r from-[#fcf8ee]/95 to-[#fcefee]/95 dark:from-[#171422]/95 dark:to-[#1f1a2c]/95 backdrop-blur-md`}
      >
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 md:px-8">
          <Link href="/" className="shrink-0" aria-label="Unfoldinn home">
            <Logo size="sm" showTagline={false} />
          </Link>

          <nav className="hidden lg:flex items-center gap-6" aria-label="Primary">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`relative font-wix-text text-[13px] font-semibold leading-[19.5px] transition-colors ${
                  isActive(link.path)
                    ? 'text-[#29253a] dark:text-white'
                    : 'text-[#29253a]/80 hover:text-[#29253a] dark:text-[#c9c3d5] dark:hover:text-white'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-[#e39a5d]"
                    transition={{ duration: 0.4, ease: EASE }}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#e5dfef] bg-white/80 px-3.5 py-1.5 font-wix-text text-[13px] font-semibold text-[#29253a] transition-colors hover:border-[#29253a]/40"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f6b47d]/30 text-[10px] font-bold text-[#29253a]">
                  {firstName.charAt(0).toUpperCase()}
                </span>
                <span>{firstName}</span>
                {remainingCredits > 0 && (
                  <span className="rounded-full bg-sprout-soft px-2 py-0.5 font-mono text-[10px] font-bold text-sprout-deep">
                    {remainingCredits} Cr
                  </span>
                )}
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 py-1.5 font-wix-text text-[13px] font-semibold text-[#29253a]/80 transition-colors hover:text-[#29253a] dark:text-[#c9c3d5] dark:hover:text-white"
              >
                <User className="h-3.5 w-3.5 text-[#e39a5d]" />
                <span>Sign In</span>
              </Link>
            )}

            <ThemeToggle variant="icon" className="inline-flex" />

            <Link
              href="/book"
              className="group hidden sm:inline-flex h-12 items-center justify-center gap-2.5 rounded-[100px] bg-[#29253a] px-6 font-wix-text text-[14px] font-semibold text-white transition-all duration-300 hover:bg-[#3a3451] active:scale-[0.98]"
            >
              <span>Start a conversation</span>
              <img
                src="/icons/arrow-right-circle-nav.svg"
                alt=""
                width={20}
                height={20}
                aria-hidden="true"
                className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              className="lg:hidden relative flex h-11 w-11 items-center justify-center rounded-full border border-[#e5dfef] bg-white/90 text-[#29253a] shadow-sm transition-transform active:scale-95"
            >
              <span
                className={`absolute h-0.5 w-4 bg-[#29253a] transition-transform duration-300 ${
                  isOpen ? 'rotate-45' : '-translate-y-[3.5px]'
                }`}
              />
              <span
                className={`absolute h-0.5 w-4 bg-[#29253a] transition-transform duration-300 ${
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
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 z-overlay flex flex-col overflow-y-auto bg-gradient-to-b from-[#fcf8ee] to-[#fcefee] lg:hidden"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e5dfef] bg-[#fcf8ee]/95 px-4 py-4 backdrop-blur-md">
              <Link href="/" onClick={() => setIsOpen(false)} aria-label="Unfoldinn home">
                <Logo size="sm" showTagline={false} />
              </Link>
              <div className="flex items-center gap-2">
                <ThemeToggle variant="icon" />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5dfef] bg-white text-[#29253a] shadow-sm"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <nav className="flex flex-1 flex-col justify-between px-6 py-8" aria-label="Mobile">
              <div className="space-y-3">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-2xl px-4 py-3 font-wix-display text-2xl font-medium text-[#29253a] hover:bg-white/70"
                >
                  Home
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`block rounded-2xl px-4 py-3 font-wix-display text-2xl font-medium transition-colors ${
                      isActive(link.path)
                        ? 'bg-white text-[#29253a]'
                        : 'text-[#29253a]/80 hover:bg-white/60 hover:text-[#29253a]'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="mt-8 space-y-3 border-t border-[#e5dfef] pt-6">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center justify-center rounded-full border border-[#29253a]/20 bg-white px-6 py-3.5 font-wix-text text-sm font-semibold text-[#29253a]"
                  >
                    Go to Dashboard ({firstName})
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center justify-center rounded-full border border-[#29253a]/20 bg-white px-6 py-3.5 font-wix-text text-sm font-semibold text-[#29253a]"
                  >
                    Sign In
                  </Link>
                )}
                <Link
                  href="/book"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#29253a] px-6 py-3.5 font-wix-text text-sm font-semibold text-white"
                >
                  <span>Start a conversation</span>
                  <img
                    src="/icons/arrow-right-circle-nav.svg"
                    alt=""
                    width={18}
                    height={18}
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
