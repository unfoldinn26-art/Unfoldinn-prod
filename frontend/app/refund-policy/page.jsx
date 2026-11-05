import Link from 'next/link';
import Button from '../../components/ui/Button';
import Breadcrumbs from '../../components/ui/Breadcrumbs';

export const metadata = {
  title: 'Refund & Engagement Policy | Unfoldinn',
  description:
    'Engagement and refund policy for Unfoldinn. Introductory conversations are currently complimentary with full fee transparency.',
  keywords: [
    'Unfoldinn refund policy',
    'mentoring fee terms',
    'cancellation policy',
    'complimentary conversation terms',
  ],
  alternates: {
    canonical: 'https://unfoldinn.com/refund-policy',
  },
  openGraph: {
    title: 'Refund & Engagement Policy — Unfoldinn',
    description: 'Engagement policy for Unfoldinn. Introductory conversations are currently complimentary.',
    url: 'https://unfoldinn.com/refund-policy',
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="w-full">
      <div className="page-x pt-20 sm:pt-28 md:pt-36 pb-16 sm:pb-24 md:pb-36">
        <div className="max-w-3xl mx-auto">
          <Breadcrumbs items={[{ name: 'Refund Policy', href: '/refund-policy' }]} />
          {/* Header */}
          <div className="border-b border-line pb-8 sm:pb-10 mb-8 sm:mb-12 mt-4 sm:mt-6">
            <span className="meta text-signal mb-3 sm:mb-4 block">Fair Practice Notice</span>
            <h1 className="font-serif text-[clamp(2.1rem,5.5vw,4.5rem)] leading-[1] sm:leading-[0.95] tracking-[-0.02em] text-ink mb-4 sm:mb-6">
              Engagement &amp; Refund Policy
            </h1>
            <p className="meta text-muted">
              Last Updated: October 2026
            </p>
          </div>

          {/* Core Policy Statement */}
          <div className="rounded-[1.25rem] sm:rounded-[1.75rem] border border-line bg-paper-2 p-6 sm:p-8 md:p-12 space-y-4 sm:space-y-6">
            <h2 className="font-serif text-[clamp(1.35rem,2.5vw,2rem)] text-ink leading-snug">
              Complimentary Introductory Conversations
            </h2>
            <p className="text-[1rem] sm:text-[1.125rem] leading-[1.75] text-ink-2">
              The introductory conversation is currently complimentary. Terms applicable to any future paid engagement will be communicated clearly before payment.
            </p>
            <p className="text-[0.875rem] sm:text-[0.9375rem] text-muted leading-relaxed">
              We believe meaningful mentoring begins with trust, transparency, and clarity. There are no surprise fees or automatic commitments.
            </p>
            <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <Button href="/book">Start a Conversation</Button>
              <Link href="/contact" className="meta text-ink underline decoration-ink/20 hover:decoration-signal py-1 inline-block">
                Have a question? Write to unfoldinn26@gmail.com →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
