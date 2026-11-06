'use client';

import Link from 'next/link';
import Arrow from './ui/Arrow';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const footerNavLinks = [
  { name: 'Home', href: '/' },
  { name: 'Start a Conversation', href: '/book' },
  { name: 'About Deepak', href: '/about' },
  { name: 'How It Works', href: '/how-it-works' },
  { name: 'For Students', href: '/for-students' },
  { name: 'For Parents', href: '/for-parents' },
  { name: 'For Institutions', href: '/for-institutions' },
  { name: 'Privacy & Boundaries', href: '/privacy-boundaries' },
  { name: 'Privacy Policy', href: '/privacy-policy' },
  { name: 'Terms & Conditions', href: '/terms-and-conditions' },
  { name: 'Refund Policy', href: '/refund-policy' },
  { name: 'Support', href: '/support' },
];

export default function Footer() {
  return (
    <footer className="relative mt-12 sm:mt-16 border-t border-line bg-paper-2 overflow-x-clip">
      <div className="page-x pt-14 sm:pt-20 md:pt-28">
        {/* Invitation row */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-6">
          <div className="md:col-span-7">
            <div className="mb-6 sm:mb-8">
              <Logo size="md" showTagline={true} />
            </div>
            <p className="max-w-[18ch] font-serif text-[clamp(2rem,4.4vw,4rem)] leading-[1.05] sm:leading-[1] tracking-[-0.02em] text-ink">
              Your first step can simply be a conversation.
            </p>
            <Link
              href="/book"
              className="group mt-8 sm:mt-10 inline-flex w-full sm:w-auto items-center justify-between sm:justify-start gap-3 rounded-full bg-ink pl-6 pr-1.5 py-1.5 font-medium text-paper transition-[transform,background-color] duration-500 ease-editorial hover:bg-ink-2 active:scale-[0.98] min-h-[48px]"
            >
              <span>Start a Conversation</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/10 transition-transform duration-500 ease-editorial group-hover:translate-x-0.5">
                <Arrow className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>

          <div className="md:col-span-5 md:pl-10 md:border-l md:border-line">
            <p className="meta mb-3 sm:mb-4">Contact &amp; Details</p>
            <div className="mb-5 text-[0.9375rem] text-ink">
              <p className="font-semibold text-ink">Deepak Sogani</p>
              <p className="text-muted text-xs">Founder, Unfoldinn</p>
              <p className="text-muted text-xs">Jaipur, Rajasthan, India</p>
            </div>
            <ul className="space-y-3.5 text-[0.9375rem]">
              <li>
                <a href="mailto:unfoldinn26@gmail.com" className="group flex flex-col">
                  <span className="text-muted text-[0.8125rem]">Email</span>
                  <span className="text-ink break-all underline decoration-ink/20 underline-offset-4 group-hover:decoration-signal">
                    unfoldinn26@gmail.com
                  </span>
                </a>
              </li>
              <li className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
                <a href="https://wa.me/917737220724" target="_blank" rel="noopener noreferrer" className="text-ink hover:text-signal transition-colors font-medium min-h-[36px] inline-flex items-center">
                  WhatsApp ↗
                </a>
                <a href="tel:+917737220724" className="text-ink hover:text-signal transition-colors font-mono text-[0.8125rem] tracking-tight min-h-[36px] inline-flex items-center">
                  +91 77372 20724
                </a>
                <a href="https://www.linkedin.com/in/deepak-sogani/" target="_blank" rel="noopener noreferrer" className="text-ink hover:text-signal transition-colors min-h-[36px] inline-flex items-center">
                  LinkedIn ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Quick Links Row */}
        <div className="mt-12 sm:mt-16 border-t border-line pt-6 sm:pt-8">
          <ul className="flex flex-wrap items-center gap-x-6 sm:gap-x-8 gap-y-2.5 sm:gap-y-3 text-[0.8125rem] sm:text-[0.875rem]">
            {footerNavLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted hover:text-ink transition-colors py-1 inline-block">
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Wordmark */}
        <div aria-hidden="true" className="select-none overflow-hidden pt-12 sm:pt-16 md:pt-20">
          <p className="whitespace-nowrap font-serif text-[clamp(2.75rem,14.5vw,15rem)] leading-[0.82] tracking-[-0.04em] text-ink">
            Unfoldinn<span className="text-signal">.</span>
          </p>
        </div>

        <div className="flex flex-col gap-4 border-t border-line py-6 text-[0.8125rem] text-muted md:flex-row md:items-center md:justify-between pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <p>© 2026 Unfoldinn. Young Minds. New Perspectives. Wider Possibilities.</p>
          <ThemeToggle variant="footer" />
        </div>
      </div>
    </footer>
  );
}
