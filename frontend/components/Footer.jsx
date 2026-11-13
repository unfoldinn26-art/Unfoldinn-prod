'use client';

import Link from 'next/link';
import Logo from './Logo';

const exploreLinks = [
  { name: 'For Students', href: '/for-students' },
  { name: 'For Parents', href: '/for-parents' },
  { name: 'For Institutions', href: '/for-institutions' },
  { name: 'How It Works', href: '/how-it-works' },
  { name: 'About Deepak', href: '/about' },
];

const careLinks = [
  { name: 'Privacy & safety', href: '/privacy-policy' },
  { name: 'Professional boundaries', href: '/privacy-boundaries' },
  { name: 'Start a conversation', href: '/book' },
  { name: 'Terms & Conditions', href: '/terms-and-conditions' },
  { name: 'Refund Policy', href: '/refund-policy' },
  { name: 'Support', href: '/support' },
];

export default function Footer() {
  return (
    <footer className="bg-[#29253a] text-[#e5dfef]">
      <div className="mx-auto max-w-[1280px] px-6 pt-16 pb-10 sm:px-10 md:px-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          {/* Brand Column */}
          <div className="md:col-span-5">
            <Logo size="md" variant="dark" showTagline={false} />
            <p className="mt-5 max-w-[300px] font-wix-text text-[12px] leading-[20.4px] text-[#b8b1c8]">
              A personal mentoring space for young people, led by Deepak Sogani in Jaipur.
            </p>
          </div>

          {/* Explore */}
          <div className="md:col-span-2">
            <p className="font-wix-text text-[12px] font-bold leading-[18px] text-white">
              Explore
            </p>
            <ul className="mt-4 space-y-3">
              {exploreLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-wix-text text-[12px] leading-[18px] text-[#c9c3d5] transition-colors hover:text-[#f6b47d]"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="md:col-span-3">
            <p className="font-wix-text text-[12px] font-bold leading-[18px] text-white">
              Connect
            </p>
            <ul className="mt-4 space-y-3 font-wix-text text-[12px] leading-[18px] text-[#c9c3d5]">
              <li>
                <a
                  href="mailto:secondinnings136@gmail.com"
                  className="transition-colors hover:text-[#f6b47d]"
                >
                  secondinnings136@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+917737220724"
                  className="transition-colors hover:text-[#f6b47d]"
                >
                  +91 77372 20724
                </a>
              </li>
              <li>Jaipur, India</li>
            </ul>
          </div>

          {/* Care */}
          <div className="md:col-span-2">
            <p className="font-wix-text text-[12px] font-bold leading-[18px] text-white">
              Care
            </p>
            <ul className="mt-4 space-y-3">
              {careLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-wix-text text-[12px] leading-[18px] text-[#c9c3d5] transition-colors hover:text-[#f6b47d]"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[#494354] pt-6 sm:flex-row sm:items-center">
          <p className="font-wix-text text-[10px] leading-[15px] text-[#938da0]">
            &copy; 2026 Unfoldinn
          </p>
          <p className="font-wix-text text-[10px] leading-[15px] text-[#938da0]">
            Listen first. Understand second. Explore what&rsquo;s possible.
          </p>
        </div>
      </div>
    </footer>
  );
}
